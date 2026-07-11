namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class ReadWriteUserControl
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
            this.components = new System.ComponentModel.Container();
            this.offsetLabel = new System.Windows.Forms.Label();
            this.bankComboBox = new System.Windows.Forms.ComboBox();
            this.lengthTextBox = new System.Windows.Forms.TextBox();
            this.startTextBox = new System.Windows.Forms.TextBox();
            this.lengthLabel = new System.Windows.Forms.Label();
            this.bankLabel = new System.Windows.Forms.Label();
            this.dataTextBox = new System.Windows.Forms.TextBox();
            this.selectMaskLabel = new System.Windows.Forms.Label();
            this.dataLabel = new System.Windows.Forms.Label();
            this.writeButton = new System.Windows.Forms.Button();
            this.readButton = new System.Windows.Forms.Button();
            this.writeSingleButton = new System.Windows.Forms.Button();
            this.selectMaskTextBox = new System.Windows.Forms.TextBox();
            this.targetLabel = new System.Windows.Forms.Label();
            this.targetComboBox = new System.Windows.Forms.ComboBox();
            this.helperToolTip = new System.Windows.Forms.ToolTip(this.components);
            this.SuspendLayout();
            // 
            // offsetLabel
            // 
            this.offsetLabel.AutoSize = true;
            this.offsetLabel.Location = new System.Drawing.Point(39, 36);
            this.offsetLabel.Name = "offsetLabel";
            this.offsetLabel.Size = new System.Drawing.Size(29, 13);
            this.offsetLabel.TabIndex = 0;
            this.offsetLabel.Text = "Start";
            // 
            // bankComboBox
            // 
            this.bankComboBox.FormattingEnabled = true;
            this.bankComboBox.Location = new System.Drawing.Point(74, 85);
            this.bankComboBox.Name = "bankComboBox";
            this.bankComboBox.Size = new System.Drawing.Size(191, 21);
            this.bankComboBox.TabIndex = 1;
            this.helperToolTip.SetToolTip(this.bankComboBox, "The memory bank to read or write");
            // 
            // lengthTextBox
            // 
            this.lengthTextBox.Location = new System.Drawing.Point(74, 59);
            this.lengthTextBox.Name = "lengthTextBox";
            this.lengthTextBox.Size = new System.Drawing.Size(191, 20);
            this.lengthTextBox.TabIndex = 2;
            this.helperToolTip.SetToolTip(this.lengthTextBox, "The number of words to read or write");
            // 
            // startTextBox
            // 
            this.startTextBox.Location = new System.Drawing.Point(74, 33);
            this.startTextBox.Name = "startTextBox";
            this.startTextBox.Size = new System.Drawing.Size(191, 20);
            this.startTextBox.TabIndex = 3;
            this.helperToolTip.SetToolTip(this.startTextBox, "The offset in words into the memory bank to start from");
            // 
            // lengthLabel
            // 
            this.lengthLabel.AutoSize = true;
            this.lengthLabel.Location = new System.Drawing.Point(28, 59);
            this.lengthLabel.Name = "lengthLabel";
            this.lengthLabel.Size = new System.Drawing.Size(40, 13);
            this.lengthLabel.TabIndex = 4;
            this.lengthLabel.Text = "Length";
            // 
            // bankLabel
            // 
            this.bankLabel.AutoSize = true;
            this.bankLabel.Location = new System.Drawing.Point(36, 85);
            this.bankLabel.Name = "bankLabel";
            this.bankLabel.Size = new System.Drawing.Size(32, 13);
            this.bankLabel.TabIndex = 5;
            this.bankLabel.Text = "Bank";
            // 
            // dataTextBox
            // 
            this.dataTextBox.Location = new System.Drawing.Point(74, 138);
            this.dataTextBox.Name = "dataTextBox";
            this.dataTextBox.Size = new System.Drawing.Size(191, 20);
            this.dataTextBox.TabIndex = 7;
            this.helperToolTip.SetToolTip(this.dataTextBox, "The data to write to the transponder");
            // 
            // selectMaskLabel
            // 
            this.selectMaskLabel.AutoSize = true;
            this.selectMaskLabel.Location = new System.Drawing.Point(5, 115);
            this.selectMaskLabel.Name = "selectMaskLabel";
            this.selectMaskLabel.Size = new System.Drawing.Size(63, 13);
            this.selectMaskLabel.TabIndex = 9;
            this.selectMaskLabel.Text = "SelectMask";
            // 
            // dataLabel
            // 
            this.dataLabel.AutoSize = true;
            this.dataLabel.Location = new System.Drawing.Point(38, 139);
            this.dataLabel.Name = "dataLabel";
            this.dataLabel.Size = new System.Drawing.Size(30, 13);
            this.dataLabel.TabIndex = 10;
            this.dataLabel.Text = "Data";
            // 
            // writeButton
            // 
            this.writeButton.Location = new System.Drawing.Point(109, 170);
            this.writeButton.Name = "writeButton";
            this.writeButton.Size = new System.Drawing.Size(75, 23);
            this.writeButton.TabIndex = 12;
            this.writeButton.Text = "Write";
            this.writeButton.UseVisualStyleBackColor = true;
            // 
            // readButton
            // 
            this.readButton.Location = new System.Drawing.Point(28, 170);
            this.readButton.Name = "readButton";
            this.readButton.Size = new System.Drawing.Size(75, 23);
            this.readButton.TabIndex = 13;
            this.readButton.Text = "Read";
            this.readButton.UseVisualStyleBackColor = true;
            // 
            // writeSingleButton
            // 
            this.writeSingleButton.Location = new System.Drawing.Point(190, 170);
            this.writeSingleButton.Name = "writeSingleButton";
            this.writeSingleButton.Size = new System.Drawing.Size(75, 23);
            this.writeSingleButton.TabIndex = 14;
            this.writeSingleButton.Text = "Write Single";
            this.writeSingleButton.UseVisualStyleBackColor = true;
            // 
            // selectMaskTextBox
            // 
            this.selectMaskTextBox.Location = new System.Drawing.Point(74, 112);
            this.selectMaskTextBox.Name = "selectMaskTextBox";
            this.selectMaskTextBox.Size = new System.Drawing.Size(191, 20);
            this.selectMaskTextBox.TabIndex = 15;
            this.helperToolTip.SetToolTip(this.selectMaskTextBox, "When target is EPC paste a full EPC here. When the targert is TID paste the full " +
                    "TID here");
            // 
            // targetLabel
            // 
            this.targetLabel.AutoSize = true;
            this.targetLabel.Location = new System.Drawing.Point(33, 9);
            this.targetLabel.Name = "targetLabel";
            this.targetLabel.Size = new System.Drawing.Size(38, 13);
            this.targetLabel.TabIndex = 16;
            this.targetLabel.Text = "Target";
            // 
            // targetComboBox
            // 
            this.targetComboBox.FormattingEnabled = true;
            this.targetComboBox.Location = new System.Drawing.Point(74, 6);
            this.targetComboBox.Name = "targetComboBox";
            this.targetComboBox.Size = new System.Drawing.Size(191, 21);
            this.targetComboBox.TabIndex = 17;
            this.helperToolTip.SetToolTip(this.targetComboBox, "Determines how to identify the transponder to write. By EPC or by TID (only use f" +
                    "or serialized TID)");
            // 
            // ReadWriteUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.targetComboBox);
            this.Controls.Add(this.targetLabel);
            this.Controls.Add(this.selectMaskTextBox);
            this.Controls.Add(this.writeSingleButton);
            this.Controls.Add(this.readButton);
            this.Controls.Add(this.writeButton);
            this.Controls.Add(this.dataLabel);
            this.Controls.Add(this.selectMaskLabel);
            this.Controls.Add(this.dataTextBox);
            this.Controls.Add(this.bankLabel);
            this.Controls.Add(this.lengthLabel);
            this.Controls.Add(this.startTextBox);
            this.Controls.Add(this.lengthTextBox);
            this.Controls.Add(this.bankComboBox);
            this.Controls.Add(this.offsetLabel);
            this.Name = "ReadWriteUserControl";
            this.Size = new System.Drawing.Size(328, 221);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label offsetLabel;
        private System.Windows.Forms.ComboBox bankComboBox;
        private System.Windows.Forms.TextBox lengthTextBox;
        private System.Windows.Forms.TextBox startTextBox;
        private System.Windows.Forms.Label lengthLabel;
        private System.Windows.Forms.Label bankLabel;
        private System.Windows.Forms.TextBox dataTextBox;
        private System.Windows.Forms.Label selectMaskLabel;
        private System.Windows.Forms.Label dataLabel;
        private System.Windows.Forms.Button writeButton;
        private System.Windows.Forms.Button readButton;
        private System.Windows.Forms.Button writeSingleButton;
        private System.Windows.Forms.TextBox selectMaskTextBox;
        private System.Windows.Forms.Label targetLabel;
        private System.Windows.Forms.ComboBox targetComboBox;
        private System.Windows.Forms.ToolTip helperToolTip;
    }
}
