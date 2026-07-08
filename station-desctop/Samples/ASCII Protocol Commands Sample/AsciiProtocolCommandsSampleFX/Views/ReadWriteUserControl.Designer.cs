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
            this.dataBankComboBox = new System.Windows.Forms.ComboBox();
            this.dataLengthTextBox = new System.Windows.Forms.TextBox();
            this.dataOffsetTextBox = new System.Windows.Forms.TextBox();
            this.lengthLabel = new System.Windows.Forms.Label();
            this.bankLabel = new System.Windows.Forms.Label();
            this.dataTextBox = new System.Windows.Forms.TextBox();
            this.dataLabel = new System.Windows.Forms.Label();
            this.writeButton = new System.Windows.Forms.Button();
            this.readButton = new System.Windows.Forms.Button();
            this.writeSingleButton = new System.Windows.Forms.Button();
            this.helperToolTip = new System.Windows.Forms.ToolTip(this.components);
            this.selectDataEpcButton = new System.Windows.Forms.Button();
            this.selectDataTidButton = new System.Windows.Forms.Button();
            this.selectDataNoneButton = new System.Windows.Forms.Button();
            this.lockGroupBox = new System.Windows.Forms.GroupBox();
            this.lockUserMemoryRestrictionComboBox = new System.Windows.Forms.ComboBox();
            this.label5 = new System.Windows.Forms.Label();
            this.lockTidMemoryRestrictionComboBox = new System.Windows.Forms.ComboBox();
            this.label4 = new System.Windows.Forms.Label();
            this.lockKillPasswordRestrictionComboBox = new System.Windows.Forms.ComboBox();
            this.label3 = new System.Windows.Forms.Label();
            this.lockEpcMemoryRestrictionComboBox = new System.Windows.Forms.ComboBox();
            this.label2 = new System.Windows.Forms.Label();
            this.lockAccessPasswordRestrictionComboBox = new System.Windows.Forms.ComboBox();
            this.label1 = new System.Windows.Forms.Label();
            this.accessPasswordTextBox = new System.Windows.Forms.TextBox();
            this.killPasswordTextBox = new System.Windows.Forms.TextBox();
            this.dataGroupBox = new System.Windows.Forms.GroupBox();
            this.flowLayoutPanel1 = new System.Windows.Forms.FlowLayoutPanel();
            this.lockButton = new System.Windows.Forms.Button();
            this.passwordsGroupBox = new System.Windows.Forms.GroupBox();
            this.killPasswordLabel = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.valueOfQGroupBox = new System.Windows.Forms.GroupBox();
            this.valueOfQTrackBar = new System.Windows.Forms.TrackBar();
            this.queryParametersUserControl1 = new TechnologySolutions.AsciiProtocolSample.Views.QueryParametersUserControl();
            this.selectParametersUserControl1 = new TechnologySolutions.AsciiProtocolSample.Views.SelectParametersUserControl();
            this.lockGroupBox.SuspendLayout();
            this.dataGroupBox.SuspendLayout();
            this.flowLayoutPanel1.SuspendLayout();
            this.passwordsGroupBox.SuspendLayout();
            this.valueOfQGroupBox.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.valueOfQTrackBar)).BeginInit();
            this.SuspendLayout();
            // 
            // offsetLabel
            // 
            this.offsetLabel.AutoSize = true;
            this.offsetLabel.Location = new System.Drawing.Point(16, 19);
            this.offsetLabel.Name = "offsetLabel";
            this.offsetLabel.Size = new System.Drawing.Size(35, 13);
            this.offsetLabel.TabIndex = 0;
            this.offsetLabel.Text = "Offset";
            // 
            // dataBankComboBox
            // 
            this.dataBankComboBox.FormattingEnabled = true;
            this.dataBankComboBox.Location = new System.Drawing.Point(57, 68);
            this.dataBankComboBox.Name = "dataBankComboBox";
            this.dataBankComboBox.Size = new System.Drawing.Size(191, 21);
            this.dataBankComboBox.TabIndex = 1;
            this.helperToolTip.SetToolTip(this.dataBankComboBox, "The memory bank to read or write");
            // 
            // dataLengthTextBox
            // 
            this.dataLengthTextBox.Location = new System.Drawing.Point(57, 42);
            this.dataLengthTextBox.Name = "dataLengthTextBox";
            this.dataLengthTextBox.Size = new System.Drawing.Size(191, 20);
            this.dataLengthTextBox.TabIndex = 2;
            this.helperToolTip.SetToolTip(this.dataLengthTextBox, "The number of words to read or write");
            // 
            // dataOffsetTextBox
            // 
            this.dataOffsetTextBox.Location = new System.Drawing.Point(57, 16);
            this.dataOffsetTextBox.Name = "dataOffsetTextBox";
            this.dataOffsetTextBox.Size = new System.Drawing.Size(191, 20);
            this.dataOffsetTextBox.TabIndex = 3;
            this.helperToolTip.SetToolTip(this.dataOffsetTextBox, "The offset in words into the memory bank to start from");
            // 
            // lengthLabel
            // 
            this.lengthLabel.AutoSize = true;
            this.lengthLabel.Location = new System.Drawing.Point(11, 45);
            this.lengthLabel.Name = "lengthLabel";
            this.lengthLabel.Size = new System.Drawing.Size(40, 13);
            this.lengthLabel.TabIndex = 4;
            this.lengthLabel.Text = "Length";
            // 
            // bankLabel
            // 
            this.bankLabel.AutoSize = true;
            this.bankLabel.Location = new System.Drawing.Point(19, 71);
            this.bankLabel.Name = "bankLabel";
            this.bankLabel.Size = new System.Drawing.Size(32, 13);
            this.bankLabel.TabIndex = 5;
            this.bankLabel.Text = "Bank";
            // 
            // dataTextBox
            // 
            this.dataTextBox.Location = new System.Drawing.Point(57, 95);
            this.dataTextBox.Name = "dataTextBox";
            this.dataTextBox.Size = new System.Drawing.Size(191, 20);
            this.dataTextBox.TabIndex = 7;
            this.helperToolTip.SetToolTip(this.dataTextBox, "The data to write to the transponder");
            // 
            // dataLabel
            // 
            this.dataLabel.AutoSize = true;
            this.dataLabel.Location = new System.Drawing.Point(21, 98);
            this.dataLabel.Name = "dataLabel";
            this.dataLabel.Size = new System.Drawing.Size(30, 13);
            this.dataLabel.TabIndex = 10;
            this.dataLabel.Text = "Data";
            // 
            // writeButton
            // 
            this.writeButton.Location = new System.Drawing.Point(275, 281);
            this.writeButton.Name = "writeButton";
            this.writeButton.Size = new System.Drawing.Size(258, 23);
            this.writeButton.TabIndex = 12;
            this.writeButton.Text = "Write";
            this.writeButton.UseVisualStyleBackColor = true;
            // 
            // readButton
            // 
            this.readButton.Location = new System.Drawing.Point(275, 252);
            this.readButton.Name = "readButton";
            this.readButton.Size = new System.Drawing.Size(258, 23);
            this.readButton.TabIndex = 13;
            this.readButton.Text = "Read";
            this.readButton.UseVisualStyleBackColor = true;
            // 
            // writeSingleButton
            // 
            this.writeSingleButton.Location = new System.Drawing.Point(275, 310);
            this.writeSingleButton.Name = "writeSingleButton";
            this.writeSingleButton.Size = new System.Drawing.Size(258, 23);
            this.writeSingleButton.TabIndex = 14;
            this.writeSingleButton.Text = "Write Single";
            this.writeSingleButton.UseVisualStyleBackColor = true;
            // 
            // selectDataEpcButton
            // 
            this.selectDataEpcButton.Location = new System.Drawing.Point(275, 165);
            this.selectDataEpcButton.Name = "selectDataEpcButton";
            this.selectDataEpcButton.Size = new System.Drawing.Size(258, 23);
            this.selectDataEpcButton.TabIndex = 26;
            this.selectDataEpcButton.Text = "Data EPC";
            this.helperToolTip.SetToolTip(this.selectDataEpcButton, "Assume Select Data is an EPC and set the other parameters appropriately");
            this.selectDataEpcButton.UseVisualStyleBackColor = true;
            // 
            // selectDataTidButton
            // 
            this.selectDataTidButton.Location = new System.Drawing.Point(275, 136);
            this.selectDataTidButton.Name = "selectDataTidButton";
            this.selectDataTidButton.Size = new System.Drawing.Size(258, 23);
            this.selectDataTidButton.TabIndex = 27;
            this.selectDataTidButton.Text = "Data TID";
            this.helperToolTip.SetToolTip(this.selectDataTidButton, "Assume select data is a TID and set the other parameters appropriately");
            this.selectDataTidButton.UseVisualStyleBackColor = true;
            // 
            // selectDataNoneButton
            // 
            this.selectDataNoneButton.Location = new System.Drawing.Point(275, 194);
            this.selectDataNoneButton.Name = "selectDataNoneButton";
            this.selectDataNoneButton.Size = new System.Drawing.Size(258, 23);
            this.selectDataNoneButton.TabIndex = 28;
            this.selectDataNoneButton.Text = "Data None";
            this.helperToolTip.SetToolTip(this.selectDataNoneButton, "Assume select data is a TID and set the other parameters appropriately");
            this.selectDataNoneButton.UseVisualStyleBackColor = true;
            // 
            // lockGroupBox
            // 
            this.lockGroupBox.Controls.Add(this.lockUserMemoryRestrictionComboBox);
            this.lockGroupBox.Controls.Add(this.label5);
            this.lockGroupBox.Controls.Add(this.lockTidMemoryRestrictionComboBox);
            this.lockGroupBox.Controls.Add(this.label4);
            this.lockGroupBox.Controls.Add(this.lockKillPasswordRestrictionComboBox);
            this.lockGroupBox.Controls.Add(this.label3);
            this.lockGroupBox.Controls.Add(this.lockEpcMemoryRestrictionComboBox);
            this.lockGroupBox.Controls.Add(this.label2);
            this.lockGroupBox.Controls.Add(this.lockAccessPasswordRestrictionComboBox);
            this.lockGroupBox.Controls.Add(this.label1);
            this.lockGroupBox.Location = new System.Drawing.Point(539, 3);
            this.lockGroupBox.Name = "lockGroupBox";
            this.lockGroupBox.Size = new System.Drawing.Size(258, 173);
            this.lockGroupBox.TabIndex = 23;
            this.lockGroupBox.TabStop = false;
            this.lockGroupBox.Text = "Lock Permissions";
            this.helperToolTip.SetToolTip(this.lockGroupBox, "The parameters for the lock command");
            // 
            // lockUserMemoryRestrictionComboBox
            // 
            this.lockUserMemoryRestrictionComboBox.FormattingEnabled = true;
            this.lockUserMemoryRestrictionComboBox.Location = new System.Drawing.Point(61, 127);
            this.lockUserMemoryRestrictionComboBox.Name = "lockUserMemoryRestrictionComboBox";
            this.lockUserMemoryRestrictionComboBox.Size = new System.Drawing.Size(191, 21);
            this.lockUserMemoryRestrictionComboBox.TabIndex = 36;
            this.helperToolTip.SetToolTip(this.lockUserMemoryRestrictionComboBox, "Restrictions for the User memory bank");
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(26, 130);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(29, 13);
            this.label5.TabIndex = 37;
            this.label5.Text = "User";
            // 
            // lockTidMemoryRestrictionComboBox
            // 
            this.lockTidMemoryRestrictionComboBox.FormattingEnabled = true;
            this.lockTidMemoryRestrictionComboBox.Location = new System.Drawing.Point(61, 100);
            this.lockTidMemoryRestrictionComboBox.Name = "lockTidMemoryRestrictionComboBox";
            this.lockTidMemoryRestrictionComboBox.Size = new System.Drawing.Size(191, 21);
            this.lockTidMemoryRestrictionComboBox.TabIndex = 34;
            this.helperToolTip.SetToolTip(this.lockTidMemoryRestrictionComboBox, "Restrictions for the TID memory bank");
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(30, 103);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(25, 13);
            this.label4.TabIndex = 35;
            this.label4.Text = "TID";
            // 
            // lockKillPasswordRestrictionComboBox
            // 
            this.lockKillPasswordRestrictionComboBox.FormattingEnabled = true;
            this.lockKillPasswordRestrictionComboBox.Location = new System.Drawing.Point(61, 46);
            this.lockKillPasswordRestrictionComboBox.Name = "lockKillPasswordRestrictionComboBox";
            this.lockKillPasswordRestrictionComboBox.Size = new System.Drawing.Size(191, 21);
            this.lockKillPasswordRestrictionComboBox.TabIndex = 32;
            this.helperToolTip.SetToolTip(this.lockKillPasswordRestrictionComboBox, "Restrictions for the Kill password");
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(35, 49);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(20, 13);
            this.label3.TabIndex = 33;
            this.label3.Text = "Kill";
            // 
            // lockEpcMemoryRestrictionComboBox
            // 
            this.lockEpcMemoryRestrictionComboBox.FormattingEnabled = true;
            this.lockEpcMemoryRestrictionComboBox.Location = new System.Drawing.Point(61, 73);
            this.lockEpcMemoryRestrictionComboBox.Name = "lockEpcMemoryRestrictionComboBox";
            this.lockEpcMemoryRestrictionComboBox.Size = new System.Drawing.Size(191, 21);
            this.lockEpcMemoryRestrictionComboBox.TabIndex = 30;
            this.helperToolTip.SetToolTip(this.lockEpcMemoryRestrictionComboBox, "Restrictions for the EPC memory bank");
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(27, 76);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(28, 13);
            this.label2.TabIndex = 31;
            this.label2.Text = "EPC";
            // 
            // lockAccessPasswordRestrictionComboBox
            // 
            this.lockAccessPasswordRestrictionComboBox.FormattingEnabled = true;
            this.lockAccessPasswordRestrictionComboBox.Location = new System.Drawing.Point(61, 19);
            this.lockAccessPasswordRestrictionComboBox.Name = "lockAccessPasswordRestrictionComboBox";
            this.lockAccessPasswordRestrictionComboBox.Size = new System.Drawing.Size(191, 21);
            this.lockAccessPasswordRestrictionComboBox.TabIndex = 28;
            this.helperToolTip.SetToolTip(this.lockAccessPasswordRestrictionComboBox, "Restrictions for the Access password");
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(13, 22);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(42, 13);
            this.label1.TabIndex = 29;
            this.label1.Text = "Access";
            // 
            // accessPasswordTextBox
            // 
            this.accessPasswordTextBox.Location = new System.Drawing.Point(6, 32);
            this.accessPasswordTextBox.Name = "accessPasswordTextBox";
            this.accessPasswordTextBox.Size = new System.Drawing.Size(229, 20);
            this.accessPasswordTextBox.TabIndex = 3;
            this.helperToolTip.SetToolTip(this.accessPasswordTextBox, "Specifies the access password used for transponder access operations in commands " +
                    "that support it");
            // 
            // killPasswordTextBox
            // 
            this.killPasswordTextBox.Location = new System.Drawing.Point(9, 73);
            this.killPasswordTextBox.Name = "killPasswordTextBox";
            this.killPasswordTextBox.Size = new System.Drawing.Size(229, 20);
            this.killPasswordTextBox.TabIndex = 5;
            this.helperToolTip.SetToolTip(this.killPasswordTextBox, "Specifies the kill password used for transponder access operations in commands th" +
                    "at support it");
            // 
            // dataGroupBox
            // 
            this.dataGroupBox.Controls.Add(this.dataTextBox);
            this.dataGroupBox.Controls.Add(this.dataLabel);
            this.dataGroupBox.Controls.Add(this.dataOffsetTextBox);
            this.dataGroupBox.Controls.Add(this.offsetLabel);
            this.dataGroupBox.Controls.Add(this.dataBankComboBox);
            this.dataGroupBox.Controls.Add(this.dataLengthTextBox);
            this.dataGroupBox.Controls.Add(this.lengthLabel);
            this.dataGroupBox.Controls.Add(this.bankLabel);
            this.dataGroupBox.Location = new System.Drawing.Point(275, 3);
            this.dataGroupBox.Name = "dataGroupBox";
            this.dataGroupBox.Size = new System.Drawing.Size(258, 127);
            this.dataGroupBox.TabIndex = 20;
            this.dataGroupBox.TabStop = false;
            this.dataGroupBox.Text = "Data Parameters";
            // 
            // flowLayoutPanel1
            // 
            this.flowLayoutPanel1.Controls.Add(this.selectParametersUserControl1);
            this.flowLayoutPanel1.Controls.Add(this.queryParametersUserControl1);
            this.flowLayoutPanel1.Controls.Add(this.dataGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.selectDataTidButton);
            this.flowLayoutPanel1.Controls.Add(this.selectDataEpcButton);
            this.flowLayoutPanel1.Controls.Add(this.selectDataNoneButton);
            this.flowLayoutPanel1.Controls.Add(this.lockButton);
            this.flowLayoutPanel1.Controls.Add(this.readButton);
            this.flowLayoutPanel1.Controls.Add(this.writeButton);
            this.flowLayoutPanel1.Controls.Add(this.writeSingleButton);
            this.flowLayoutPanel1.Controls.Add(this.lockGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.passwordsGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.valueOfQGroupBox);
            this.flowLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel1.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flowLayoutPanel1.Location = new System.Drawing.Point(0, 0);
            this.flowLayoutPanel1.Name = "flowLayoutPanel1";
            this.flowLayoutPanel1.Size = new System.Drawing.Size(845, 448);
            this.flowLayoutPanel1.TabIndex = 22;
            // 
            // lockButton
            // 
            this.lockButton.Location = new System.Drawing.Point(275, 223);
            this.lockButton.Name = "lockButton";
            this.lockButton.Size = new System.Drawing.Size(258, 23);
            this.lockButton.TabIndex = 22;
            this.lockButton.Text = "Lock";
            this.lockButton.UseVisualStyleBackColor = true;
            // 
            // passwordsGroupBox
            // 
            this.passwordsGroupBox.Controls.Add(this.killPasswordLabel);
            this.passwordsGroupBox.Controls.Add(this.killPasswordTextBox);
            this.passwordsGroupBox.Controls.Add(this.label6);
            this.passwordsGroupBox.Controls.Add(this.accessPasswordTextBox);
            this.passwordsGroupBox.Location = new System.Drawing.Point(539, 182);
            this.passwordsGroupBox.Name = "passwordsGroupBox";
            this.passwordsGroupBox.Size = new System.Drawing.Size(258, 107);
            this.passwordsGroupBox.TabIndex = 24;
            this.passwordsGroupBox.TabStop = false;
            this.passwordsGroupBox.Text = "Passwords";
            // 
            // killPasswordLabel
            // 
            this.killPasswordLabel.AutoSize = true;
            this.killPasswordLabel.Location = new System.Drawing.Point(6, 57);
            this.killPasswordLabel.Name = "killPasswordLabel";
            this.killPasswordLabel.Size = new System.Drawing.Size(69, 13);
            this.killPasswordLabel.TabIndex = 6;
            this.killPasswordLabel.Text = "Kill Password";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(6, 16);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(91, 13);
            this.label6.TabIndex = 4;
            this.label6.Text = "Access Password";
            // 
            // valueOfQGroupBox
            // 
            this.valueOfQGroupBox.Controls.Add(this.valueOfQTrackBar);
            this.valueOfQGroupBox.Location = new System.Drawing.Point(539, 295);
            this.valueOfQGroupBox.Name = "valueOfQGroupBox";
            this.valueOfQGroupBox.Size = new System.Drawing.Size(258, 62);
            this.valueOfQGroupBox.TabIndex = 25;
            this.valueOfQGroupBox.TabStop = false;
            this.valueOfQGroupBox.Text = "Q Value";
            // 
            // valueOfQTrackBar
            // 
            this.valueOfQTrackBar.Location = new System.Drawing.Point(6, 19);
            this.valueOfQTrackBar.Maximum = 15;
            this.valueOfQTrackBar.Name = "valueOfQTrackBar";
            this.valueOfQTrackBar.Size = new System.Drawing.Size(246, 45);
            this.valueOfQTrackBar.TabIndex = 0;
            this.valueOfQTrackBar.Value = 9;
            // 
            // queryParametersUserControl1
            // 
            this.queryParametersUserControl1.Location = new System.Drawing.Point(3, 231);
            this.queryParametersUserControl1.Name = "queryParametersUserControl1";
            this.queryParametersUserControl1.Size = new System.Drawing.Size(264, 108);
            this.queryParametersUserControl1.TabIndex = 29;
            // 
            // selectParametersUserControl1
            // 
            this.selectParametersUserControl1.Location = new System.Drawing.Point(3, 3);
            this.selectParametersUserControl1.Name = "selectParametersUserControl1";
            this.selectParametersUserControl1.Size = new System.Drawing.Size(266, 222);
            this.selectParametersUserControl1.TabIndex = 30;
            // 
            // ReadWriteUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.flowLayoutPanel1);
            this.Name = "ReadWriteUserControl";
            this.Size = new System.Drawing.Size(845, 448);
            this.lockGroupBox.ResumeLayout(false);
            this.lockGroupBox.PerformLayout();
            this.dataGroupBox.ResumeLayout(false);
            this.dataGroupBox.PerformLayout();
            this.flowLayoutPanel1.ResumeLayout(false);
            this.passwordsGroupBox.ResumeLayout(false);
            this.passwordsGroupBox.PerformLayout();
            this.valueOfQGroupBox.ResumeLayout(false);
            this.valueOfQGroupBox.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.valueOfQTrackBar)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Label offsetLabel;
        private System.Windows.Forms.ComboBox dataBankComboBox;
        private System.Windows.Forms.TextBox dataLengthTextBox;
        private System.Windows.Forms.TextBox dataOffsetTextBox;
        private System.Windows.Forms.Label lengthLabel;
        private System.Windows.Forms.Label bankLabel;
        private System.Windows.Forms.TextBox dataTextBox;
        private System.Windows.Forms.Label dataLabel;
        private System.Windows.Forms.Button writeButton;
        private System.Windows.Forms.Button readButton;
        private System.Windows.Forms.Button writeSingleButton;
        private System.Windows.Forms.ToolTip helperToolTip;
        private System.Windows.Forms.GroupBox dataGroupBox;
        private System.Windows.Forms.Button selectDataTidButton;
        private System.Windows.Forms.Button selectDataEpcButton;
        private System.Windows.Forms.Button selectDataNoneButton;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel1;
        private System.Windows.Forms.Button lockButton;
        private System.Windows.Forms.GroupBox lockGroupBox;
        private System.Windows.Forms.ComboBox lockUserMemoryRestrictionComboBox;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.ComboBox lockTidMemoryRestrictionComboBox;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.ComboBox lockKillPasswordRestrictionComboBox;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.ComboBox lockEpcMemoryRestrictionComboBox;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.ComboBox lockAccessPasswordRestrictionComboBox;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.GroupBox passwordsGroupBox;
        private System.Windows.Forms.Label killPasswordLabel;
        private System.Windows.Forms.TextBox killPasswordTextBox;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.TextBox accessPasswordTextBox;
        private System.Windows.Forms.GroupBox valueOfQGroupBox;
        private System.Windows.Forms.TrackBar valueOfQTrackBar;
        private SelectParametersUserControl selectParametersUserControl1;
        private QueryParametersUserControl queryParametersUserControl1;
    }
}
