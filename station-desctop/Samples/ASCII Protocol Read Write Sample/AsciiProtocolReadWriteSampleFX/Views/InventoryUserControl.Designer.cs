namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class InventoryUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.GroupBox transponderGroupBox;
        private System.Windows.Forms.Button scanRfidButton;
        private System.Windows.Forms.Button scanRfidAsyncButton;
        private System.Windows.Forms.Panel panel3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.ComboBox queryTargetComboBox;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.ComboBox querySessionComboBox;

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

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.transponderGroupBox = new System.Windows.Forms.GroupBox();
            this.scanRfidButton = new System.Windows.Forms.Button();
            this.scanRfidAsyncButton = new System.Windows.Forms.Button();
            this.panel3 = new System.Windows.Forms.Panel();
            this.label4 = new System.Windows.Forms.Label();
            this.queryTargetComboBox = new System.Windows.Forms.ComboBox();
            this.label3 = new System.Windows.Forms.Label();
            this.querySessionComboBox = new System.Windows.Forms.ComboBox();
            this.transponderGroupBox.SuspendLayout();
            this.panel3.SuspendLayout();
            this.SuspendLayout();
            // 
            // transponderGroupBox
            // 
            this.transponderGroupBox.Controls.Add(this.scanRfidButton);
            this.transponderGroupBox.Controls.Add(this.scanRfidAsyncButton);
            this.transponderGroupBox.Controls.Add(this.panel3);
            this.transponderGroupBox.Location = new System.Drawing.Point(3, 3);
            this.transponderGroupBox.Name = "transponderGroupBox";
            this.transponderGroupBox.Size = new System.Drawing.Size(220, 139);
            this.transponderGroupBox.TabIndex = 1;
            this.transponderGroupBox.TabStop = false;
            this.transponderGroupBox.Text = "Transponder";
            // 
            // scanRfidButton
            // 
            this.scanRfidButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanRfidButton.Location = new System.Drawing.Point(6, 106);
            this.scanRfidButton.Name = "scanRfidButton";
            this.scanRfidButton.Size = new System.Drawing.Size(193, 23);
            this.scanRfidButton.TabIndex = 5;
            this.scanRfidButton.Text = "Scan";
            this.scanRfidButton.UseVisualStyleBackColor = true;
            // 
            // scanRfidAsyncButton
            // 
            this.scanRfidAsyncButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanRfidAsyncButton.Location = new System.Drawing.Point(6, 77);
            this.scanRfidAsyncButton.Name = "scanRfidAsyncButton";
            this.scanRfidAsyncButton.Size = new System.Drawing.Size(193, 23);
            this.scanRfidAsyncButton.TabIndex = 16;
            this.scanRfidAsyncButton.Text = "Scan (Async)";
            this.scanRfidAsyncButton.UseVisualStyleBackColor = true;
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
            // InventoryUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.transponderGroupBox);
            this.Name = "InventoryUserControl";
            this.Size = new System.Drawing.Size(227, 147);
            this.transponderGroupBox.ResumeLayout(false);
            this.panel3.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion        
    }
}
