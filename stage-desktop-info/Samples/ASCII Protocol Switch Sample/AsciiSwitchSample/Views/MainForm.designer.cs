namespace TechnologySolutions.AsciiProtocol.Sample.Views
{
    partial class MainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        private System.Windows.Forms.MenuStrip mainMenuStrip;
        private System.Windows.Forms.ToolStripMenuItem fileToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem exitToolStripMenuItem;
        private System.Windows.Forms.StatusStrip mainStatusStrip;
        private System.Windows.Forms.Button scanRfidButton;
        private System.Windows.Forms.ToolStripMenuItem readerToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem portToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem connectToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem disconnectToolStripMenuItem;
        private System.Windows.Forms.ListBox responsesListBox;
        private System.Windows.Forms.Button scanBarcodeButton;
        private System.Windows.Forms.ListBox messagesListBox;
        private System.Windows.Forms.ToolTip helperToolTip;
        private System.Windows.Forms.ToolStripMenuItem refreshPortsToolStripMenuItem;
        private System.Windows.Forms.ToolStripStatusLabel messageToolStripStatusLabel;
        private System.Windows.Forms.SplitContainer mainSplitContainer;
        private System.Windows.Forms.Panel resultPanel;
        private System.Windows.Forms.Label messagesLabel;
        private System.Windows.Forms.ToolStripMenuItem viewToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem showProtocolResponsesToolStripMenuItem;
        private System.Windows.Forms.Button scanRfidAsyncButton;
        private System.Windows.Forms.Button scanBarcodeAsyncButton;
        private System.Windows.Forms.ToolStripSeparator toolStripSeparator1;
        private System.Windows.Forms.ToolStripMenuItem clearAllResponsesToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem clearProtocolResponsesToolStripMenuItem;
        private System.Windows.Forms.ComboBox querySessionComboBox;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Panel panel3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.ComboBox queryTargetComboBox;
        private System.Windows.Forms.Button clearTransponderResponsesButton;
        private System.Windows.Forms.ToolStripSeparator toolStripSeparator2;
        private System.Windows.Forms.GroupBox switchActionGroupBox;
        private System.Windows.Forms.ComboBox switchSinglePressActionComboBox;
        private System.Windows.Forms.Label switchSinglePressActionLabel;
        private System.Windows.Forms.CheckBox switchAsynchronousMessagesCheckBox;
        private System.Windows.Forms.ComboBox switchDoublePressActionComboBox;
        private System.Windows.Forms.Label switchDoublePressActionLabel;
        private System.Windows.Forms.Button switchActionApplyButton;
        private System.Windows.Forms.Button switchActionReadButton;
        private System.Windows.Forms.Panel leftPanel;
        private System.Windows.Forms.GroupBox singlePressUserActionGroupBox;
        private System.Windows.Forms.Button switchSinglePressUserActionApplyButton;
        private System.Windows.Forms.Button switchSinglePressUserActionReadButton;
        private System.Windows.Forms.GroupBox actionsGroupBox;
        private System.Windows.Forms.Button abortCommandButton;
        private System.Windows.Forms.Button switchDoublePressButton;
        private System.Windows.Forms.Button switchSinglePressButton;
        private System.Windows.Forms.Button factoryDefaultsButton;
        private System.Windows.Forms.GroupBox switchDoublePressUserActionGroupBox;
        private System.Windows.Forms.Button switchDoublePressUserActionApplyButton;
        private System.Windows.Forms.Button switchDoublePressUserActionReadButton;
        private System.Windows.Forms.NumericUpDown switchDurationNumericUpDown;
        private System.Windows.Forms.TextBox singlePressUserActionTextBox;
        private System.Windows.Forms.TextBox doublePressUserActionTextBox;
        private System.Windows.Forms.Panel rightPanel;
        private System.Windows.Forms.GroupBox barcodeGroupBox;
        private System.Windows.Forms.GroupBox transponderGroupBox;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Button readSwitchStateButton;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (this.components != null))
            {
                this.components.Dispose();
            }

            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.mainMenuStrip = new System.Windows.Forms.MenuStrip();
            this.fileToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.exitToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.readerToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.refreshPortsToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.portToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.connectToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.disconnectToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.viewToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.clearAllResponsesToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
            this.clearProtocolResponsesToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
            this.showProtocolResponsesToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.mainStatusStrip = new System.Windows.Forms.StatusStrip();
            this.messageToolStripStatusLabel = new System.Windows.Forms.ToolStripStatusLabel();
            this.scanRfidButton = new System.Windows.Forms.Button();
            this.scanBarcodeButton = new System.Windows.Forms.Button();
            this.messagesListBox = new System.Windows.Forms.ListBox();
            this.responsesListBox = new System.Windows.Forms.ListBox();
            this.helperToolTip = new System.Windows.Forms.ToolTip(this.components);
            this.scanRfidAsyncButton = new System.Windows.Forms.Button();
            this.scanBarcodeAsyncButton = new System.Windows.Forms.Button();
            this.singlePressUserActionGroupBox = new System.Windows.Forms.GroupBox();
            this.singlePressUserActionTextBox = new System.Windows.Forms.TextBox();
            this.switchSinglePressUserActionApplyButton = new System.Windows.Forms.Button();
            this.switchSinglePressUserActionReadButton = new System.Windows.Forms.Button();
            this.switchDoublePressUserActionGroupBox = new System.Windows.Forms.GroupBox();
            this.doublePressUserActionTextBox = new System.Windows.Forms.TextBox();
            this.switchDoublePressUserActionApplyButton = new System.Windows.Forms.Button();
            this.switchDoublePressUserActionReadButton = new System.Windows.Forms.Button();
            this.factoryDefaultsButton = new System.Windows.Forms.Button();
            this.switchSinglePressButton = new System.Windows.Forms.Button();
            this.switchDoublePressButton = new System.Windows.Forms.Button();
            this.abortCommandButton = new System.Windows.Forms.Button();
            this.switchDurationNumericUpDown = new System.Windows.Forms.NumericUpDown();
            this.readSwitchStateButton = new System.Windows.Forms.Button();
            this.mainSplitContainer = new System.Windows.Forms.SplitContainer();
            this.resultPanel = new System.Windows.Forms.Panel();
            this.clearTransponderResponsesButton = new System.Windows.Forms.Button();
            this.messagesLabel = new System.Windows.Forms.Label();
            this.panel3 = new System.Windows.Forms.Panel();
            this.label4 = new System.Windows.Forms.Label();
            this.queryTargetComboBox = new System.Windows.Forms.ComboBox();
            this.label3 = new System.Windows.Forms.Label();
            this.querySessionComboBox = new System.Windows.Forms.ComboBox();
            this.switchActionGroupBox = new System.Windows.Forms.GroupBox();
            this.switchActionApplyButton = new System.Windows.Forms.Button();
            this.switchActionReadButton = new System.Windows.Forms.Button();
            this.switchDoublePressActionComboBox = new System.Windows.Forms.ComboBox();
            this.switchDoublePressActionLabel = new System.Windows.Forms.Label();
            this.switchSinglePressActionComboBox = new System.Windows.Forms.ComboBox();
            this.switchSinglePressActionLabel = new System.Windows.Forms.Label();
            this.switchAsynchronousMessagesCheckBox = new System.Windows.Forms.CheckBox();
            this.leftPanel = new System.Windows.Forms.Panel();
            this.actionsGroupBox = new System.Windows.Forms.GroupBox();
            this.rightPanel = new System.Windows.Forms.Panel();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.barcodeGroupBox = new System.Windows.Forms.GroupBox();
            this.transponderGroupBox = new System.Windows.Forms.GroupBox();
            this.mainMenuStrip.SuspendLayout();
            this.mainStatusStrip.SuspendLayout();
            this.singlePressUserActionGroupBox.SuspendLayout();
            this.switchDoublePressUserActionGroupBox.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.switchDurationNumericUpDown)).BeginInit();
            this.mainSplitContainer.Panel1.SuspendLayout();
            this.mainSplitContainer.Panel2.SuspendLayout();
            this.mainSplitContainer.SuspendLayout();
            this.resultPanel.SuspendLayout();
            this.panel3.SuspendLayout();
            this.switchActionGroupBox.SuspendLayout();
            this.leftPanel.SuspendLayout();
            this.actionsGroupBox.SuspendLayout();
            this.rightPanel.SuspendLayout();
            this.groupBox1.SuspendLayout();
            this.barcodeGroupBox.SuspendLayout();
            this.transponderGroupBox.SuspendLayout();
            this.SuspendLayout();
            // 
            // mainMenuStrip
            // 
            this.mainMenuStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.fileToolStripMenuItem,
            this.readerToolStripMenuItem,
            this.viewToolStripMenuItem});
            this.mainMenuStrip.Location = new System.Drawing.Point(0, 0);
            this.mainMenuStrip.Name = "mainMenuStrip";
            this.mainMenuStrip.Size = new System.Drawing.Size(1167, 24);
            this.mainMenuStrip.TabIndex = 0;
            this.mainMenuStrip.Text = "menuStrip1";
            // 
            // fileToolStripMenuItem
            // 
            this.fileToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.exitToolStripMenuItem});
            this.fileToolStripMenuItem.Name = "fileToolStripMenuItem";
            this.fileToolStripMenuItem.Size = new System.Drawing.Size(37, 20);
            this.fileToolStripMenuItem.Text = "&File";
            // 
            // exitToolStripMenuItem
            // 
            this.exitToolStripMenuItem.Name = "exitToolStripMenuItem";
            this.exitToolStripMenuItem.Size = new System.Drawing.Size(92, 22);
            this.exitToolStripMenuItem.Text = "E&xit";
            this.exitToolStripMenuItem.Click += new System.EventHandler(this.ExitToolStripMenuItem_Click);
            // 
            // readerToolStripMenuItem
            // 
            this.readerToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.refreshPortsToolStripMenuItem,
            this.portToolStripMenuItem,
            this.connectToolStripMenuItem,
            this.disconnectToolStripMenuItem});
            this.readerToolStripMenuItem.Name = "readerToolStripMenuItem";
            this.readerToolStripMenuItem.Size = new System.Drawing.Size(55, 20);
            this.readerToolStripMenuItem.Text = "&Reader";
            // 
            // refreshPortsToolStripMenuItem
            // 
            this.refreshPortsToolStripMenuItem.Name = "refreshPortsToolStripMenuItem";
            this.refreshPortsToolStripMenuItem.Size = new System.Drawing.Size(143, 22);
            this.refreshPortsToolStripMenuItem.Text = "&Refresh Ports";
            // 
            // portToolStripMenuItem
            // 
            this.portToolStripMenuItem.Name = "portToolStripMenuItem";
            this.portToolStripMenuItem.Size = new System.Drawing.Size(143, 22);
            this.portToolStripMenuItem.Text = "&Port";
            // 
            // connectToolStripMenuItem
            // 
            this.connectToolStripMenuItem.Name = "connectToolStripMenuItem";
            this.connectToolStripMenuItem.Size = new System.Drawing.Size(143, 22);
            this.connectToolStripMenuItem.Text = "&Connect";
            // 
            // disconnectToolStripMenuItem
            // 
            this.disconnectToolStripMenuItem.Name = "disconnectToolStripMenuItem";
            this.disconnectToolStripMenuItem.Size = new System.Drawing.Size(143, 22);
            this.disconnectToolStripMenuItem.Text = "&Disconnect";
            // 
            // viewToolStripMenuItem
            // 
            this.viewToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.clearAllResponsesToolStripMenuItem,
            this.toolStripSeparator2,
            this.clearProtocolResponsesToolStripMenuItem,
            this.toolStripSeparator1,
            this.showProtocolResponsesToolStripMenuItem});
            this.viewToolStripMenuItem.Name = "viewToolStripMenuItem";
            this.viewToolStripMenuItem.Size = new System.Drawing.Size(44, 20);
            this.viewToolStripMenuItem.Text = "View";
            // 
            // clearAllResponsesToolStripMenuItem
            // 
            this.clearAllResponsesToolStripMenuItem.Name = "clearAllResponsesToolStripMenuItem";
            this.clearAllResponsesToolStripMenuItem.Size = new System.Drawing.Size(209, 22);
            this.clearAllResponsesToolStripMenuItem.Text = "Clear All Responses";
            this.clearAllResponsesToolStripMenuItem.Click += new System.EventHandler(this.ClearAllResponsesToolStripMenuItem_Click);
            // 
            // toolStripSeparator2
            // 
            this.toolStripSeparator2.Name = "toolStripSeparator2";
            this.toolStripSeparator2.Size = new System.Drawing.Size(206, 6);
            // 
            // clearProtocolResponsesToolStripMenuItem
            // 
            this.clearProtocolResponsesToolStripMenuItem.Name = "clearProtocolResponsesToolStripMenuItem";
            this.clearProtocolResponsesToolStripMenuItem.Size = new System.Drawing.Size(209, 22);
            this.clearProtocolResponsesToolStripMenuItem.Text = "Clear Protocol Responses";
            this.clearProtocolResponsesToolStripMenuItem.Click += new System.EventHandler(this.ClearProtocolResponsesToolStripMenuItem_Click);
            // 
            // toolStripSeparator1
            // 
            this.toolStripSeparator1.Name = "toolStripSeparator1";
            this.toolStripSeparator1.Size = new System.Drawing.Size(206, 6);
            // 
            // showProtocolResponsesToolStripMenuItem
            // 
            this.showProtocolResponsesToolStripMenuItem.Name = "showProtocolResponsesToolStripMenuItem";
            this.showProtocolResponsesToolStripMenuItem.Size = new System.Drawing.Size(209, 22);
            this.showProtocolResponsesToolStripMenuItem.Text = "Show Protocol Responses";
            this.showProtocolResponsesToolStripMenuItem.Click += new System.EventHandler(this.ShowProtocolResponsesToolStripMenuItem_Click);
            // 
            // mainStatusStrip
            // 
            this.mainStatusStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.messageToolStripStatusLabel});
            this.mainStatusStrip.Location = new System.Drawing.Point(0, 573);
            this.mainStatusStrip.Name = "mainStatusStrip";
            this.mainStatusStrip.Size = new System.Drawing.Size(1167, 22);
            this.mainStatusStrip.TabIndex = 1;
            this.mainStatusStrip.Text = "statusStrip1";
            // 
            // messageToolStripStatusLabel
            // 
            this.messageToolStripStatusLabel.Name = "messageToolStripStatusLabel";
            this.messageToolStripStatusLabel.Size = new System.Drawing.Size(118, 17);
            this.messageToolStripStatusLabel.Text = "No reader connected";
            // 
            // scanRfidButton
            // 
            this.scanRfidButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanRfidButton.Location = new System.Drawing.Point(6, 106);
            this.scanRfidButton.Name = "scanRfidButton";
            this.scanRfidButton.Size = new System.Drawing.Size(193, 23);
            this.scanRfidButton.TabIndex = 5;
            this.scanRfidButton.Text = "Scan";
            this.helperToolTip.SetToolTip(this.scanRfidButton, "Scan for RFID Transponders using a synchronous command");
            this.scanRfidButton.UseVisualStyleBackColor = true;
            // 
            // scanBarcodeButton
            // 
            this.scanBarcodeButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanBarcodeButton.Location = new System.Drawing.Point(6, 22);
            this.scanBarcodeButton.Name = "scanBarcodeButton";
            this.scanBarcodeButton.Size = new System.Drawing.Size(193, 23);
            this.scanBarcodeButton.TabIndex = 8;
            this.scanBarcodeButton.Text = "Scan";
            this.helperToolTip.SetToolTip(this.scanBarcodeButton, "Scan for barcodes using a synchronous command");
            this.scanBarcodeButton.UseVisualStyleBackColor = true;
            // 
            // messagesListBox
            // 
            this.messagesListBox.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
                        | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.messagesListBox.Font = new System.Drawing.Font("Courier New", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.messagesListBox.FormattingEnabled = true;
            this.messagesListBox.IntegralHeight = false;
            this.messagesListBox.ItemHeight = 16;
            this.messagesListBox.Location = new System.Drawing.Point(8, 30);
            this.messagesListBox.Name = "messagesListBox";
            this.messagesListBox.Size = new System.Drawing.Size(682, 358);
            this.messagesListBox.TabIndex = 1;
            // 
            // responsesListBox
            // 
            this.responsesListBox.Dock = System.Windows.Forms.DockStyle.Fill;
            this.responsesListBox.Font = new System.Drawing.Font("Courier New", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.responsesListBox.FormattingEnabled = true;
            this.responsesListBox.IntegralHeight = false;
            this.responsesListBox.ItemHeight = 14;
            this.responsesListBox.Location = new System.Drawing.Point(0, 0);
            this.responsesListBox.Name = "responsesListBox";
            this.responsesListBox.Size = new System.Drawing.Size(701, 148);
            this.responsesListBox.TabIndex = 0;
            // 
            // scanRfidAsyncButton
            // 
            this.scanRfidAsyncButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanRfidAsyncButton.Location = new System.Drawing.Point(6, 77);
            this.scanRfidAsyncButton.Name = "scanRfidAsyncButton";
            this.scanRfidAsyncButton.Size = new System.Drawing.Size(193, 23);
            this.scanRfidAsyncButton.TabIndex = 16;
            this.scanRfidAsyncButton.Text = "Scan (Async)";
            this.helperToolTip.SetToolTip(this.scanRfidAsyncButton, "Scan for RFID Transponders using an asynchronous command");
            this.scanRfidAsyncButton.UseVisualStyleBackColor = true;
            // 
            // scanBarcodeAsyncButton
            // 
            this.scanBarcodeAsyncButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanBarcodeAsyncButton.Location = new System.Drawing.Point(6, 51);
            this.scanBarcodeAsyncButton.Name = "scanBarcodeAsyncButton";
            this.scanBarcodeAsyncButton.Size = new System.Drawing.Size(193, 23);
            this.scanBarcodeAsyncButton.TabIndex = 15;
            this.scanBarcodeAsyncButton.Text = "Scan (Async)";
            this.helperToolTip.SetToolTip(this.scanBarcodeAsyncButton, "Scan for barcodes using an asynchronous command");
            this.scanBarcodeAsyncButton.UseVisualStyleBackColor = true;
            // 
            // singlePressUserActionGroupBox
            // 
            this.singlePressUserActionGroupBox.Controls.Add(this.singlePressUserActionTextBox);
            this.singlePressUserActionGroupBox.Controls.Add(this.switchSinglePressUserActionApplyButton);
            this.singlePressUserActionGroupBox.Controls.Add(this.switchSinglePressUserActionReadButton);
            this.singlePressUserActionGroupBox.Location = new System.Drawing.Point(3, 208);
            this.singlePressUserActionGroupBox.Name = "singlePressUserActionGroupBox";
            this.singlePressUserActionGroupBox.Size = new System.Drawing.Size(219, 88);
            this.singlePressUserActionGroupBox.TabIndex = 18;
            this.singlePressUserActionGroupBox.TabStop = false;
            this.singlePressUserActionGroupBox.Text = "Single Press User Action";
            this.helperToolTip.SetToolTip(this.singlePressUserActionGroupBox, "The command that is performed when the double press action is configured to user");
            // 
            // singlePressUserActionTextBox
            // 
            this.singlePressUserActionTextBox.Location = new System.Drawing.Point(10, 19);
            this.singlePressUserActionTextBox.Name = "singlePressUserActionTextBox";
            this.singlePressUserActionTextBox.Size = new System.Drawing.Size(203, 20);
            this.singlePressUserActionTextBox.TabIndex = 3;
            // 
            // switchSinglePressUserActionApplyButton
            // 
            this.switchSinglePressUserActionApplyButton.Location = new System.Drawing.Point(138, 46);
            this.switchSinglePressUserActionApplyButton.Name = "switchSinglePressUserActionApplyButton";
            this.switchSinglePressUserActionApplyButton.Size = new System.Drawing.Size(75, 23);
            this.switchSinglePressUserActionApplyButton.TabIndex = 2;
            this.switchSinglePressUserActionApplyButton.Text = "Apply";
            this.switchSinglePressUserActionApplyButton.UseVisualStyleBackColor = true;
            // 
            // switchSinglePressUserActionReadButton
            // 
            this.switchSinglePressUserActionReadButton.Location = new System.Drawing.Point(10, 46);
            this.switchSinglePressUserActionReadButton.Name = "switchSinglePressUserActionReadButton";
            this.switchSinglePressUserActionReadButton.Size = new System.Drawing.Size(75, 23);
            this.switchSinglePressUserActionReadButton.TabIndex = 1;
            this.switchSinglePressUserActionReadButton.Text = "Read";
            this.switchSinglePressUserActionReadButton.UseVisualStyleBackColor = true;
            // 
            // switchDoublePressUserActionGroupBox
            // 
            this.switchDoublePressUserActionGroupBox.Controls.Add(this.doublePressUserActionTextBox);
            this.switchDoublePressUserActionGroupBox.Controls.Add(this.switchDoublePressUserActionApplyButton);
            this.switchDoublePressUserActionGroupBox.Controls.Add(this.switchDoublePressUserActionReadButton);
            this.switchDoublePressUserActionGroupBox.Location = new System.Drawing.Point(3, 302);
            this.switchDoublePressUserActionGroupBox.Name = "switchDoublePressUserActionGroupBox";
            this.switchDoublePressUserActionGroupBox.Size = new System.Drawing.Size(219, 88);
            this.switchDoublePressUserActionGroupBox.TabIndex = 19;
            this.switchDoublePressUserActionGroupBox.TabStop = false;
            this.switchDoublePressUserActionGroupBox.Text = "Double Press User Action";
            this.helperToolTip.SetToolTip(this.switchDoublePressUserActionGroupBox, "The command that is performed when the double press action is configured to user");
            // 
            // doublePressUserActionTextBox
            // 
            this.doublePressUserActionTextBox.Location = new System.Drawing.Point(9, 20);
            this.doublePressUserActionTextBox.Name = "doublePressUserActionTextBox";
            this.doublePressUserActionTextBox.Size = new System.Drawing.Size(203, 20);
            this.doublePressUserActionTextBox.TabIndex = 4;
            // 
            // switchDoublePressUserActionApplyButton
            // 
            this.switchDoublePressUserActionApplyButton.Location = new System.Drawing.Point(138, 46);
            this.switchDoublePressUserActionApplyButton.Name = "switchDoublePressUserActionApplyButton";
            this.switchDoublePressUserActionApplyButton.Size = new System.Drawing.Size(75, 23);
            this.switchDoublePressUserActionApplyButton.TabIndex = 2;
            this.switchDoublePressUserActionApplyButton.Text = "Apply";
            this.switchDoublePressUserActionApplyButton.UseVisualStyleBackColor = true;
            // 
            // switchDoublePressUserActionReadButton
            // 
            this.switchDoublePressUserActionReadButton.Location = new System.Drawing.Point(10, 46);
            this.switchDoublePressUserActionReadButton.Name = "switchDoublePressUserActionReadButton";
            this.switchDoublePressUserActionReadButton.Size = new System.Drawing.Size(75, 23);
            this.switchDoublePressUserActionReadButton.TabIndex = 1;
            this.switchDoublePressUserActionReadButton.Text = "Read";
            this.helperToolTip.SetToolTip(this.switchDoublePressUserActionReadButton, "Read the current double press user action from the reader");
            this.switchDoublePressUserActionReadButton.UseVisualStyleBackColor = true;
            // 
            // factoryDefaultsButton
            // 
            this.factoryDefaultsButton.Location = new System.Drawing.Point(6, 19);
            this.factoryDefaultsButton.Name = "factoryDefaultsButton";
            this.factoryDefaultsButton.Size = new System.Drawing.Size(141, 23);
            this.factoryDefaultsButton.TabIndex = 0;
            this.factoryDefaultsButton.Text = "Factory Defaults";
            this.helperToolTip.SetToolTip(this.factoryDefaultsButton, "Restore the reader to factory defaults");
            this.factoryDefaultsButton.UseVisualStyleBackColor = true;
            // 
            // switchSinglePressButton
            // 
            this.switchSinglePressButton.Location = new System.Drawing.Point(12, 19);
            this.switchSinglePressButton.Name = "switchSinglePressButton";
            this.switchSinglePressButton.Size = new System.Drawing.Size(141, 23);
            this.switchSinglePressButton.TabIndex = 1;
            this.switchSinglePressButton.Text = "Single Press";
            this.helperToolTip.SetToolTip(this.switchSinglePressButton, "Command the reader to perform a single press for x seconds");
            this.switchSinglePressButton.UseVisualStyleBackColor = true;
            // 
            // switchDoublePressButton
            // 
            this.switchDoublePressButton.Location = new System.Drawing.Point(12, 48);
            this.switchDoublePressButton.Name = "switchDoublePressButton";
            this.switchDoublePressButton.Size = new System.Drawing.Size(141, 23);
            this.switchDoublePressButton.TabIndex = 2;
            this.switchDoublePressButton.Text = "Double Press";
            this.helperToolTip.SetToolTip(this.switchDoublePressButton, "Command the reader to perform a double press for x seconds");
            this.switchDoublePressButton.UseVisualStyleBackColor = true;
            // 
            // abortCommandButton
            // 
            this.abortCommandButton.Location = new System.Drawing.Point(6, 48);
            this.abortCommandButton.Name = "abortCommandButton";
            this.abortCommandButton.Size = new System.Drawing.Size(141, 23);
            this.abortCommandButton.TabIndex = 3;
            this.abortCommandButton.Text = "Abort";
            this.helperToolTip.SetToolTip(this.abortCommandButton, "Abort the currently executing command (e.g. switch press)");
            this.abortCommandButton.UseVisualStyleBackColor = true;
            // 
            // switchDurationNumericUpDown
            // 
            this.switchDurationNumericUpDown.Location = new System.Drawing.Point(159, 19);
            this.switchDurationNumericUpDown.Maximum = new decimal(new int[] {
            99,
            0,
            0,
            0});
            this.switchDurationNumericUpDown.Name = "switchDurationNumericUpDown";
            this.switchDurationNumericUpDown.Size = new System.Drawing.Size(44, 20);
            this.switchDurationNumericUpDown.TabIndex = 4;
            this.helperToolTip.SetToolTip(this.switchDurationNumericUpDown, "Duration a switch press should last for 0..99 seconds");
            // 
            // readSwitchStateButton
            // 
            this.readSwitchStateButton.Location = new System.Drawing.Point(12, 77);
            this.readSwitchStateButton.Name = "readSwitchStateButton";
            this.readSwitchStateButton.Size = new System.Drawing.Size(141, 23);
            this.readSwitchStateButton.TabIndex = 5;
            this.readSwitchStateButton.Text = "Read Switch State";
            this.helperToolTip.SetToolTip(this.readSwitchStateButton, "Command the reader to read the current switch state");
            this.readSwitchStateButton.UseVisualStyleBackColor = true;
            // 
            // mainSplitContainer
            // 
            this.mainSplitContainer.Dock = System.Windows.Forms.DockStyle.Fill;
            this.mainSplitContainer.Location = new System.Drawing.Point(233, 24);
            this.mainSplitContainer.Name = "mainSplitContainer";
            this.mainSplitContainer.Orientation = System.Windows.Forms.Orientation.Horizontal;
            // 
            // mainSplitContainer.Panel1
            // 
            this.mainSplitContainer.Panel1.Controls.Add(this.responsesListBox);
            this.mainSplitContainer.Panel1MinSize = 120;
            // 
            // mainSplitContainer.Panel2
            // 
            this.mainSplitContainer.Panel2.Controls.Add(this.resultPanel);
            this.mainSplitContainer.Size = new System.Drawing.Size(701, 549);
            this.mainSplitContainer.SplitterDistance = 148;
            this.mainSplitContainer.TabIndex = 10;
            // 
            // resultPanel
            // 
            this.resultPanel.BackColor = System.Drawing.Color.LightGray;
            this.resultPanel.Controls.Add(this.clearTransponderResponsesButton);
            this.resultPanel.Controls.Add(this.messagesLabel);
            this.resultPanel.Controls.Add(this.messagesListBox);
            this.resultPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            this.resultPanel.Location = new System.Drawing.Point(0, 0);
            this.resultPanel.Name = "resultPanel";
            this.resultPanel.Size = new System.Drawing.Size(701, 397);
            this.resultPanel.TabIndex = 15;
            // 
            // clearTransponderResponsesButton
            // 
            this.clearTransponderResponsesButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.clearTransponderResponsesButton.Location = new System.Drawing.Point(639, 4);
            this.clearTransponderResponsesButton.Name = "clearTransponderResponsesButton";
            this.clearTransponderResponsesButton.Size = new System.Drawing.Size(51, 23);
            this.clearTransponderResponsesButton.TabIndex = 15;
            this.clearTransponderResponsesButton.Text = "Clear";
            this.clearTransponderResponsesButton.UseVisualStyleBackColor = true;
            this.clearTransponderResponsesButton.Click += new System.EventHandler(this.ClearTransponderResponsesButton_Click);
            // 
            // messagesLabel
            // 
            this.messagesLabel.AutoSize = true;
            this.messagesLabel.BackColor = System.Drawing.Color.LightGray;
            this.messagesLabel.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.messagesLabel.ForeColor = System.Drawing.Color.Black;
            this.messagesLabel.Location = new System.Drawing.Point(4, 7);
            this.messagesLabel.Name = "messagesLabel";
            this.messagesLabel.Size = new System.Drawing.Size(82, 20);
            this.messagesLabel.TabIndex = 14;
            this.messagesLabel.Text = "Messages";
            // 
            // panel3
            // 
            this.panel3.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.panel3.Controls.Add(this.label4);
            this.panel3.Controls.Add(this.queryTargetComboBox);
            this.panel3.Controls.Add(this.label3);
            this.panel3.Controls.Add(this.querySessionComboBox);
            this.panel3.Location = new System.Drawing.Point(6, 16);
            this.panel3.Name = "panel3";
            this.panel3.Size = new System.Drawing.Size(193, 55);
            this.panel3.TabIndex = 15;
            // 
            // label4
            // 
            this.label4.Location = new System.Drawing.Point(3, 27);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(86, 21);
            this.label4.TabIndex = 20;
            this.label4.Text = "Query Target:";
            this.label4.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            // 
            // queryTargetComboBox
            // 
            this.queryTargetComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.queryTargetComboBox.FormattingEnabled = true;
            this.queryTargetComboBox.Location = new System.Drawing.Point(95, 27);
            this.queryTargetComboBox.Name = "queryTargetComboBox";
            this.queryTargetComboBox.Size = new System.Drawing.Size(49, 21);
            this.queryTargetComboBox.TabIndex = 19;
            // 
            // label3
            // 
            this.label3.Location = new System.Drawing.Point(3, 0);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(86, 21);
            this.label3.TabIndex = 18;
            this.label3.Text = "Query Session:";
            this.label3.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            // 
            // querySessionComboBox
            // 
            this.querySessionComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.querySessionComboBox.FormattingEnabled = true;
            this.querySessionComboBox.Location = new System.Drawing.Point(95, 0);
            this.querySessionComboBox.Name = "querySessionComboBox";
            this.querySessionComboBox.Size = new System.Drawing.Size(93, 21);
            this.querySessionComboBox.TabIndex = 17;
            // 
            // switchActionGroupBox
            // 
            this.switchActionGroupBox.Controls.Add(this.switchActionApplyButton);
            this.switchActionGroupBox.Controls.Add(this.switchActionReadButton);
            this.switchActionGroupBox.Controls.Add(this.switchDoublePressActionComboBox);
            this.switchActionGroupBox.Controls.Add(this.switchDoublePressActionLabel);
            this.switchActionGroupBox.Controls.Add(this.switchSinglePressActionComboBox);
            this.switchActionGroupBox.Controls.Add(this.switchSinglePressActionLabel);
            this.switchActionGroupBox.Controls.Add(this.switchAsynchronousMessagesCheckBox);
            this.switchActionGroupBox.Location = new System.Drawing.Point(3, 3);
            this.switchActionGroupBox.Name = "switchActionGroupBox";
            this.switchActionGroupBox.Size = new System.Drawing.Size(219, 199);
            this.switchActionGroupBox.TabIndex = 17;
            this.switchActionGroupBox.TabStop = false;
            this.switchActionGroupBox.Text = "Switch Action";
            // 
            // switchActionApplyButton
            // 
            this.switchActionApplyButton.Location = new System.Drawing.Point(138, 165);
            this.switchActionApplyButton.Name = "switchActionApplyButton";
            this.switchActionApplyButton.Size = new System.Drawing.Size(75, 23);
            this.switchActionApplyButton.TabIndex = 6;
            this.switchActionApplyButton.Text = "Apply";
            this.switchActionApplyButton.UseVisualStyleBackColor = true;
            // 
            // switchActionReadButton
            // 
            this.switchActionReadButton.Location = new System.Drawing.Point(10, 165);
            this.switchActionReadButton.Name = "switchActionReadButton";
            this.switchActionReadButton.Size = new System.Drawing.Size(73, 23);
            this.switchActionReadButton.TabIndex = 5;
            this.switchActionReadButton.Text = "Read";
            this.switchActionReadButton.UseVisualStyleBackColor = true;
            // 
            // switchDoublePressActionComboBox
            // 
            this.switchDoublePressActionComboBox.FormattingEnabled = true;
            this.switchDoublePressActionComboBox.Location = new System.Drawing.Point(10, 97);
            this.switchDoublePressActionComboBox.Name = "switchDoublePressActionComboBox";
            this.switchDoublePressActionComboBox.Size = new System.Drawing.Size(203, 21);
            this.switchDoublePressActionComboBox.TabIndex = 4;
            // 
            // switchDoublePressActionLabel
            // 
            this.switchDoublePressActionLabel.AutoSize = true;
            this.switchDoublePressActionLabel.Location = new System.Drawing.Point(7, 81);
            this.switchDoublePressActionLabel.Name = "switchDoublePressActionLabel";
            this.switchDoublePressActionLabel.Size = new System.Drawing.Size(138, 13);
            this.switchDoublePressActionLabel.TabIndex = 3;
            this.switchDoublePressActionLabel.Text = "Switch Double Press Action";
            // 
            // switchSinglePressActionComboBox
            // 
            this.switchSinglePressActionComboBox.FormattingEnabled = true;
            this.switchSinglePressActionComboBox.Location = new System.Drawing.Point(10, 43);
            this.switchSinglePressActionComboBox.Name = "switchSinglePressActionComboBox";
            this.switchSinglePressActionComboBox.Size = new System.Drawing.Size(203, 21);
            this.switchSinglePressActionComboBox.TabIndex = 2;
            // 
            // switchSinglePressActionLabel
            // 
            this.switchSinglePressActionLabel.AutoSize = true;
            this.switchSinglePressActionLabel.Location = new System.Drawing.Point(7, 27);
            this.switchSinglePressActionLabel.Name = "switchSinglePressActionLabel";
            this.switchSinglePressActionLabel.Size = new System.Drawing.Size(133, 13);
            this.switchSinglePressActionLabel.TabIndex = 1;
            this.switchSinglePressActionLabel.Text = "Switch Single Press Action";
            // 
            // switchAsynchronousMessagesCheckBox
            // 
            this.switchAsynchronousMessagesCheckBox.AutoSize = true;
            this.switchAsynchronousMessagesCheckBox.Location = new System.Drawing.Point(10, 124);
            this.switchAsynchronousMessagesCheckBox.Name = "switchAsynchronousMessagesCheckBox";
            this.switchAsynchronousMessagesCheckBox.Size = new System.Drawing.Size(205, 17);
            this.switchAsynchronousMessagesCheckBox.TabIndex = 0;
            this.switchAsynchronousMessagesCheckBox.Text = "Send Switch State Change Messages";
            this.switchAsynchronousMessagesCheckBox.UseVisualStyleBackColor = true;
            // 
            // leftPanel
            // 
            this.leftPanel.Controls.Add(this.switchDoublePressUserActionGroupBox);
            this.leftPanel.Controls.Add(this.singlePressUserActionGroupBox);
            this.leftPanel.Controls.Add(this.switchActionGroupBox);
            this.leftPanel.Dock = System.Windows.Forms.DockStyle.Left;
            this.leftPanel.Location = new System.Drawing.Point(0, 24);
            this.leftPanel.Name = "leftPanel";
            this.leftPanel.Size = new System.Drawing.Size(233, 549);
            this.leftPanel.TabIndex = 11;
            // 
            // actionsGroupBox
            // 
            this.actionsGroupBox.Controls.Add(this.abortCommandButton);
            this.actionsGroupBox.Controls.Add(this.factoryDefaultsButton);
            this.actionsGroupBox.Location = new System.Drawing.Point(6, 369);
            this.actionsGroupBox.Name = "actionsGroupBox";
            this.actionsGroupBox.Size = new System.Drawing.Size(220, 85);
            this.actionsGroupBox.TabIndex = 20;
            this.actionsGroupBox.TabStop = false;
            this.actionsGroupBox.Text = "Actions";
            // 
            // rightPanel
            // 
            this.rightPanel.Controls.Add(this.actionsGroupBox);
            this.rightPanel.Controls.Add(this.groupBox1);
            this.rightPanel.Controls.Add(this.barcodeGroupBox);
            this.rightPanel.Controls.Add(this.transponderGroupBox);
            this.rightPanel.Dock = System.Windows.Forms.DockStyle.Right;
            this.rightPanel.Location = new System.Drawing.Point(934, 24);
            this.rightPanel.Name = "rightPanel";
            this.rightPanel.Size = new System.Drawing.Size(233, 549);
            this.rightPanel.TabIndex = 1;
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.readSwitchStateButton);
            this.groupBox1.Controls.Add(this.switchDurationNumericUpDown);
            this.groupBox1.Controls.Add(this.switchSinglePressButton);
            this.groupBox1.Controls.Add(this.switchDoublePressButton);
            this.groupBox1.Location = new System.Drawing.Point(6, 234);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(220, 129);
            this.groupBox1.TabIndex = 2;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Switch";
            // 
            // barcodeGroupBox
            // 
            this.barcodeGroupBox.Controls.Add(this.scanBarcodeAsyncButton);
            this.barcodeGroupBox.Controls.Add(this.scanBarcodeButton);
            this.barcodeGroupBox.Location = new System.Drawing.Point(6, 148);
            this.barcodeGroupBox.Name = "barcodeGroupBox";
            this.barcodeGroupBox.Size = new System.Drawing.Size(220, 80);
            this.barcodeGroupBox.TabIndex = 1;
            this.barcodeGroupBox.TabStop = false;
            this.barcodeGroupBox.Text = "Barcode";
            // 
            // transponderGroupBox
            // 
            this.transponderGroupBox.Controls.Add(this.scanRfidButton);
            this.transponderGroupBox.Controls.Add(this.scanRfidAsyncButton);
            this.transponderGroupBox.Controls.Add(this.panel3);
            this.transponderGroupBox.Location = new System.Drawing.Point(6, 3);
            this.transponderGroupBox.Name = "transponderGroupBox";
            this.transponderGroupBox.Size = new System.Drawing.Size(220, 139);
            this.transponderGroupBox.TabIndex = 0;
            this.transponderGroupBox.TabStop = false;
            this.transponderGroupBox.Text = "Transponder";
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1167, 595);
            this.Controls.Add(this.mainSplitContainer);
            this.Controls.Add(this.rightPanel);
            this.Controls.Add(this.leftPanel);
            this.Controls.Add(this.mainMenuStrip);
            this.Controls.Add(this.mainStatusStrip);
            this.MainMenuStrip = this.mainMenuStrip;
            this.Name = "MainForm";
            this.Text = "ASCII Switch Sample";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.MainForm_FormClosing);
            this.mainMenuStrip.ResumeLayout(false);
            this.mainMenuStrip.PerformLayout();
            this.mainStatusStrip.ResumeLayout(false);
            this.mainStatusStrip.PerformLayout();
            this.singlePressUserActionGroupBox.ResumeLayout(false);
            this.singlePressUserActionGroupBox.PerformLayout();
            this.switchDoublePressUserActionGroupBox.ResumeLayout(false);
            this.switchDoublePressUserActionGroupBox.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.switchDurationNumericUpDown)).EndInit();
            this.mainSplitContainer.Panel1.ResumeLayout(false);
            this.mainSplitContainer.Panel2.ResumeLayout(false);
            this.mainSplitContainer.ResumeLayout(false);
            this.resultPanel.ResumeLayout(false);
            this.resultPanel.PerformLayout();
            this.panel3.ResumeLayout(false);
            this.switchActionGroupBox.ResumeLayout(false);
            this.switchActionGroupBox.PerformLayout();
            this.leftPanel.ResumeLayout(false);
            this.actionsGroupBox.ResumeLayout(false);
            this.rightPanel.ResumeLayout(false);
            this.groupBox1.ResumeLayout(false);
            this.barcodeGroupBox.ResumeLayout(false);
            this.transponderGroupBox.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion        
    }
}

