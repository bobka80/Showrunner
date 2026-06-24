const fs = require('fs');
const path = require('path');

function build() {
  const DIST_DIR = path.join(__dirname, 'dist');
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
  }

  console.log('Building project...');

  // 1. Combine all HTML templates
  let htmlContent = fs.readFileSync('Index.html', 'utf8');
  const includeRegex = /<\?\!\=\s+include\(['"](.*?)['"]\)[^>]*\?>/g;
  
  let match;
  while ((match = includeRegex.exec(htmlContent)) !== null) {
    let fileName = match[1];
    try {
      let fileContent = fs.readFileSync(fileName + '.html', 'utf8');
      htmlContent = htmlContent.split(match[0]).join(fileContent);
      includeRegex.lastIndex = 0;
    } catch (e) {
      console.log("WARNING: Missing included file: " + fileName + ".html");
      htmlContent = htmlContent.split(match[0]).join("<!-- Missing: " + fileName + " -->");
      includeRegex.lastIndex = 0;
    }
  }

  // 2. Extract all inline <script> tags to avoid Google Apps Script Caja parsing bugs & 1MB limit
  let extractedJs = '';
  // This regex matches <script> tags that do NOT have a 'src' attribute
  const scriptRegex = /<script\b(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  
  htmlContent = htmlContent.replace(scriptRegex, (fullMatch, scriptCode) => {
    // Append the code to our giant JS payload
    extractedJs += scriptCode + '\n\n';
    // Remove the script tag from the HTML
    return '';
  });

  // 3. Inject Bootloader script to asynchronously fetch and execute the payload
  // This bypasses Google Apps Script's strict HtmlOutput size limits which cause 
  // silent string truncation and 'Uncaught SyntaxError: Invalid or unexpected token' on the frontend
  const bootloader = `
<script>
  console.log('Booting UI... Fetching App Logic...');
  
  // Polyfill for DOMContentLoaded because the JS is injected asynchronously AFTER the DOM is already ready!
  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'DOMContentLoaded') {
      setTimeout(listener, 1);
    } else {
      originalAddEventListener.call(document, type, listener, options);
    }
  };
  
  google.script.run.withSuccessHandler(function(count) {
     var chunks = [];
     var fetched = 0;
     for (var i=0; i<count; i++) {
        (function(index) {
          google.script.run.withSuccessHandler(function(chunkStr) {
             chunks[index] = chunkStr;
             fetched++;
             if (fetched === count) {
                console.log('App Logic received! Executing...');
                var jsCode = chunks.join('');
                var s = document.createElement('script');
                s.text = jsCode;
                document.body.appendChild(s);
             }
          }).getFrontendLogicChunk(index);
        })(i);
     }
  }).getFrontendLogicChunkCount();
</script>
`;

  htmlContent += bootloader;

  // 4. Write the clean HTML shell (which is now just a tiny bootloader)
  fs.writeFileSync(path.join(DIST_DIR, 'Index.html'), htmlContent);
  console.log(`Compiled Index.html (${(htmlContent.length / 1024).toFixed(2)} KB)`);

  // 5. Wrap the extracted Javascript into multiple backend Google Apps Script files
  // This bypasses the Google Apps Script 1MB file size limit which silently truncates large .js files
  if (fs.existsSync(path.join(DIST_DIR, 'LogicPayload.js'))) {
      fs.unlinkSync(path.join(DIST_DIR, 'LogicPayload.js'));
  }
  
  const CHUNK_SIZE = 500000;
  let chunkArray = [];
  for (let i = 0; i < extractedJs.length; i += CHUNK_SIZE) {
      chunkArray.push(extractedJs.substring(i, i + CHUNK_SIZE));
  }

  let masterLogic = `
// @INDEX: PAYLOAD -> Dynamic Frontend Logic Injection
function getFrontendLogicChunkCount() { return ${chunkArray.length}; }
function getFrontendLogicChunk(index) {
`;

  chunkArray.forEach((chunk, index) => {
      const chunkFile = path.join(DIST_DIR, `LogicPayload_${index}.js`);
      const chunkContent = `const FRONTEND_CHUNK_${index} = ${JSON.stringify(chunk)};\n`;
      fs.writeFileSync(chunkFile, chunkContent);
      console.log(`Compiled LogicPayload_${index}.js (${(chunkContent.length / 1024).toFixed(2)} KB)`);
      
      masterLogic += `  if (index === ${index}) return FRONTEND_CHUNK_${index};\n`;
  });

  masterLogic += `  return "";\n}\n`;
  
  fs.writeFileSync(path.join(DIST_DIR, 'LogicPayload_Master.js'), masterLogic);
  console.log(`Compiled LogicPayload_Master.js`);

  // 6. Copy all necessary backend .js files, appsscript.json, and Login.html
  const files = fs.readdirSync(__dirname);
  let filesCopied = 0;
  files.forEach(file => {
    if (file === 'build.js' || file === 'watch.js' || file.startsWith('scratch_') || file.startsWith('temp_')) return;
    if (fs.statSync(path.join(__dirname, file)).isDirectory()) return;
    
    if (file.endsWith('.js') || file === 'appsscript.json' || file === 'Login.html') {
      fs.copyFileSync(path.join(__dirname, file), path.join(DIST_DIR, file));
      filesCopied++;
    }
  });

  console.log(`Copied ${filesCopied} backend script files to dist/`);
  console.log('Build complete!\n');
}

build();
module.exports = build;
