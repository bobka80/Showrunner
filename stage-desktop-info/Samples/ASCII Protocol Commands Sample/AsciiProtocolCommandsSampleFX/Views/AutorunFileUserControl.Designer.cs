namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class AutorunFileUserControl
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
            this.readAutorunFileButton = new System.Windows.Forms.Button();
            this.deleteAutorunFileButton = new System.Windows.Forms.Button();
            this.addCommandToAutorunFileButton = new System.Windows.Forms.Button();
            this.commandTextBox = new System.Windows.Forms.TextBox();
            this.autorunFileGroupBox = new System.Windows.Forms.GroupBox();
            this.autorunFileGroupBox.SuspendLayout();
            this.SuspendLayout();
            // 
            // readAutorunFileButton
            // 
            this.readAutorunFileButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.readAutorunFileButton.Location = new System.Drawing.Point(6, 19);
            this.readAutorunFileButton.Name = "readAutorunFileButton";
            this.readAutorunFileButton.Size = new System.Drawing.Size(258, 23);
            this.readAutorunFileButton.TabIndex = 0;
            this.readAutorunFileButton.Text = "Download Autorun File";
            this.readAutorunFileButton.UseVisualStyleBackColor = true;
            // 
            // deleteAutorunFileButton
            // 
            this.deleteAutorunFileButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.deleteAutorunFileButton.Location = new System.Drawing.Point(6, 48);
            this.deleteAutorunFileButton.Name = "deleteAutorunFileButton";
            this.deleteAutorunFileButton.Size = new System.Drawing.Size(258, 23);
            this.deleteAutorunFileButton.TabIndex = 1;
            this.deleteAutorunFileButton.Text = "Delete Autorun File";
            this.deleteAutorunFileButton.UseVisualStyleBackColor = true;
            // 
            // addCommandToAutorunFileButton
            // 
            this.addCommandToAutorunFileButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.addCommandToAutorunFileButton.Location = new System.Drawing.Point(6, 77);
            this.addCommandToAutorunFileButton.Name = "addCommandToAutorunFileButton";
            this.addCommandToAutorunFileButton.Size = new System.Drawing.Size(258, 23);
            this.addCommandToAutorunFileButton.TabIndex = 2;
            this.addCommandToAutorunFileButton.Text = "Add Command To Autorun File";
            this.addCommandToAutorunFileButton.UseVisualStyleBackColor = true;
            // 
            // commandTextBox
            // 
            this.commandTextBox.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.commandTextBox.Location = new System.Drawing.Point(6, 106);
            this.commandTextBox.Name = "commandTextBox";
            this.commandTextBox.Size = new System.Drawing.Size(258, 20);
            this.commandTextBox.TabIndex = 3;
            // 
            // autorunFileGroupBox
            // 
            this.autorunFileGroupBox.Controls.Add(this.commandTextBox);
            this.autorunFileGroupBox.Controls.Add(this.readAutorunFileButton);
            this.autorunFileGroupBox.Controls.Add(this.addCommandToAutorunFileButton);
            this.autorunFileGroupBox.Controls.Add(this.deleteAutorunFileButton);
            this.autorunFileGroupBox.Dock = System.Windows.Forms.DockStyle.Fill;
            this.autorunFileGroupBox.Location = new System.Drawing.Point(0, 0);
            this.autorunFileGroupBox.Name = "autorunFileGroupBox";
            this.autorunFileGroupBox.Size = new System.Drawing.Size(270, 136);
            this.autorunFileGroupBox.TabIndex = 4;
            this.autorunFileGroupBox.TabStop = false;
            this.autorunFileGroupBox.Text = "Autorun File";
            // 
            // AutorunFileUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.autorunFileGroupBox);
            this.Name = "AutorunFileUserControl";
            this.Size = new System.Drawing.Size(270, 136);
            this.autorunFileGroupBox.ResumeLayout(false);
            this.autorunFileGroupBox.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button readAutorunFileButton;
        private System.Windows.Forms.Button deleteAutorunFileButton;
        private System.Windows.Forms.Button addCommandToAutorunFileButton;
        private System.Windows.Forms.TextBox commandTextBox;
        private System.Windows.Forms.GroupBox autorunFileGroupBox;
    }
}
