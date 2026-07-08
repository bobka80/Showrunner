namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class LogFileUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.logFileGroupBox = new System.Windows.Forms.GroupBox();
            this.readLoggingEnabledButton = new System.Windows.Forms.Button();
            this.enableLoggingButton = new System.Windows.Forms.Button();
            this.disableLoggingButton = new System.Windows.Forms.Button();
            this.downloadLogButton = new System.Windows.Forms.Button();
            this.deleteLogbutton = new System.Windows.Forms.Button();
            this.logFileGroupBox.SuspendLayout();
            this.SuspendLayout();
            // 
            // logFileGroupBox
            // 
            this.logFileGroupBox.Controls.Add(this.deleteLogbutton);
            this.logFileGroupBox.Controls.Add(this.downloadLogButton);
            this.logFileGroupBox.Controls.Add(this.disableLoggingButton);
            this.logFileGroupBox.Controls.Add(this.enableLoggingButton);
            this.logFileGroupBox.Controls.Add(this.readLoggingEnabledButton);
            this.logFileGroupBox.Dock = System.Windows.Forms.DockStyle.Fill;
            this.logFileGroupBox.Location = new System.Drawing.Point(0, 0);
            this.logFileGroupBox.Name = "logFileGroupBox";
            this.logFileGroupBox.Size = new System.Drawing.Size(315, 174);
            this.logFileGroupBox.TabIndex = 0;
            this.logFileGroupBox.TabStop = false;
            this.logFileGroupBox.Text = "Log File";
            // 
            // readLoggingEnabledButton
            // 
            this.readLoggingEnabledButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.readLoggingEnabledButton.Location = new System.Drawing.Point(6, 19);
            this.readLoggingEnabledButton.Name = "readLoggingEnabledButton";
            this.readLoggingEnabledButton.Size = new System.Drawing.Size(303, 23);
            this.readLoggingEnabledButton.TabIndex = 1;
            this.readLoggingEnabledButton.Text = "Read Logging Enabled";
            this.readLoggingEnabledButton.UseVisualStyleBackColor = true;
            // 
            // enableLoggingButton
            // 
            this.enableLoggingButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.enableLoggingButton.Location = new System.Drawing.Point(6, 48);
            this.enableLoggingButton.Name = "enableLoggingButton";
            this.enableLoggingButton.Size = new System.Drawing.Size(303, 23);
            this.enableLoggingButton.TabIndex = 2;
            this.enableLoggingButton.Text = "Enable Logging";
            this.enableLoggingButton.UseVisualStyleBackColor = true;
            // 
            // disableLoggingButton
            // 
            this.disableLoggingButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.disableLoggingButton.Location = new System.Drawing.Point(6, 77);
            this.disableLoggingButton.Name = "disableLoggingButton";
            this.disableLoggingButton.Size = new System.Drawing.Size(303, 23);
            this.disableLoggingButton.TabIndex = 3;
            this.disableLoggingButton.Text = "Disable Logging";
            this.disableLoggingButton.UseVisualStyleBackColor = true;
            // 
            // downloadLogButton
            // 
            this.downloadLogButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.downloadLogButton.Location = new System.Drawing.Point(6, 106);
            this.downloadLogButton.Name = "downloadLogButton";
            this.downloadLogButton.Size = new System.Drawing.Size(303, 23);
            this.downloadLogButton.TabIndex = 4;
            this.downloadLogButton.Text = "Download Log File";
            this.downloadLogButton.UseVisualStyleBackColor = true;
            // 
            // deleteLogbutton
            // 
            this.deleteLogbutton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.deleteLogbutton.Location = new System.Drawing.Point(6, 135);
            this.deleteLogbutton.Name = "deleteLogbutton";
            this.deleteLogbutton.Size = new System.Drawing.Size(303, 23);
            this.deleteLogbutton.TabIndex = 5;
            this.deleteLogbutton.Text = "Delete Log File";
            this.deleteLogbutton.UseVisualStyleBackColor = true;
            // 
            // LogFileUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.logFileGroupBox);
            this.Name = "LogFileUserControl";
            this.Size = new System.Drawing.Size(315, 174);
            this.logFileGroupBox.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox logFileGroupBox;
        private System.Windows.Forms.Button disableLoggingButton;
        private System.Windows.Forms.Button enableLoggingButton;
        private System.Windows.Forms.Button readLoggingEnabledButton;
        private System.Windows.Forms.Button deleteLogbutton;
        private System.Windows.Forms.Button downloadLogButton;
    }
}
