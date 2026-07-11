namespace TechnologySolutions.AsciiProtocolSample.Views
{
    public partial class CommonParametersUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.CheckBox includeChecksumCheckBox;
        private System.Windows.Forms.CheckBox includeDateTimeCheckBox;
        private System.Windows.Forms.CheckBox includePcCheckBox;
        private System.Windows.Forms.CheckBox includeIndexCheckBox;
        private System.Windows.Forms.CheckBox includeTransponderRssiCheckBox;
        private System.Windows.Forms.CheckBox useAlertCheckBox;
        private System.Windows.Forms.ToolTip helperToolTip;
        private System.Windows.Forms.TrackBar trackBar1;
        private System.Windows.Forms.Label outputPowerLabel;

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
            this.components = new System.ComponentModel.Container();
            this.includeChecksumCheckBox = new System.Windows.Forms.CheckBox();
            this.includeDateTimeCheckBox = new System.Windows.Forms.CheckBox();
            this.includePcCheckBox = new System.Windows.Forms.CheckBox();
            this.includeIndexCheckBox = new System.Windows.Forms.CheckBox();
            this.includeTransponderRssiCheckBox = new System.Windows.Forms.CheckBox();
            this.useAlertCheckBox = new System.Windows.Forms.CheckBox();
            this.helperToolTip = new System.Windows.Forms.ToolTip(this.components);
            this.trackBar1 = new System.Windows.Forms.TrackBar();
            this.outputPowerLabel = new System.Windows.Forms.Label();
            ((System.ComponentModel.ISupportInitialize)(this.trackBar1)).BeginInit();
            this.SuspendLayout();
            // 
            // includeChecksumCheckBox
            // 
            this.includeChecksumCheckBox.AutoSize = true;
            this.includeChecksumCheckBox.Location = new System.Drawing.Point(3, 65);
            this.includeChecksumCheckBox.Name = "includeChecksumCheckBox";
            this.includeChecksumCheckBox.Size = new System.Drawing.Size(113, 17);
            this.includeChecksumCheckBox.TabIndex = 0;
            this.includeChecksumCheckBox.Text = "Include checksum";
            this.includeChecksumCheckBox.ThreeState = true;
            this.helperToolTip.SetToolTip(this.includeChecksumCheckBox, "Include the CRC for each transponder in commands that support it");
            this.includeChecksumCheckBox.UseVisualStyleBackColor = true;
            // 
            // includeDateTimeCheckBox
            // 
            this.includeDateTimeCheckBox.AutoSize = true;
            this.includeDateTimeCheckBox.Location = new System.Drawing.Point(3, 3);
            this.includeDateTimeCheckBox.Name = "includeDateTimeCheckBox";
            this.includeDateTimeCheckBox.Size = new System.Drawing.Size(159, 17);
            this.includeDateTimeCheckBox.TabIndex = 3;
            this.includeDateTimeCheckBox.Text = "Include date and time stamp";
            this.includeDateTimeCheckBox.ThreeState = true;
            this.helperToolTip.SetToolTip(this.includeDateTimeCheckBox, "Include a timestamp for each item returned in commands that support it");
            this.includeDateTimeCheckBox.UseVisualStyleBackColor = true;
            // 
            // includePcCheckBox
            // 
            this.includePcCheckBox.AutoSize = true;
            this.includePcCheckBox.Location = new System.Drawing.Point(3, 111);
            this.includePcCheckBox.Name = "includePcCheckBox";
            this.includePcCheckBox.Size = new System.Drawing.Size(78, 17);
            this.includePcCheckBox.TabIndex = 4;
            this.includePcCheckBox.Text = "Include PC";
            this.includePcCheckBox.ThreeState = true;
            this.helperToolTip.SetToolTip(this.includePcCheckBox, "Include the PC word for each transponder in commands that support it");
            this.includePcCheckBox.UseVisualStyleBackColor = true;
            // 
            // includeIndexCheckBox
            // 
            this.includeIndexCheckBox.AutoSize = true;
            this.includeIndexCheckBox.Location = new System.Drawing.Point(3, 88);
            this.includeIndexCheckBox.Name = "includeIndexCheckBox";
            this.includeIndexCheckBox.Size = new System.Drawing.Size(89, 17);
            this.includeIndexCheckBox.TabIndex = 5;
            this.includeIndexCheckBox.Text = "Include index";
            this.includeIndexCheckBox.ThreeState = true;
            this.helperToolTip.SetToolTip(this.includeIndexCheckBox, "Include an index for each transponder in commands that support it");
            this.includeIndexCheckBox.UseVisualStyleBackColor = true;
            // 
            // includeTransponderRssiCheckBox
            // 
            this.includeTransponderRssiCheckBox.AutoSize = true;
            this.includeTransponderRssiCheckBox.Location = new System.Drawing.Point(3, 134);
            this.includeTransponderRssiCheckBox.Name = "includeTransponderRssiCheckBox";
            this.includeTransponderRssiCheckBox.Size = new System.Drawing.Size(148, 17);
            this.includeTransponderRssiCheckBox.TabIndex = 6;
            this.includeTransponderRssiCheckBox.Text = "Include transponder RSSI";
            this.includeTransponderRssiCheckBox.ThreeState = true;
            this.helperToolTip.SetToolTip(this.includeTransponderRssiCheckBox, "Include transponder RSSI for each transponder in commands that support it");
            this.includeTransponderRssiCheckBox.UseVisualStyleBackColor = true;
            // 
            // useAlertCheckBox
            // 
            this.useAlertCheckBox.AutoSize = true;
            this.useAlertCheckBox.Location = new System.Drawing.Point(3, 26);
            this.useAlertCheckBox.Name = "useAlertCheckBox";
            this.useAlertCheckBox.Size = new System.Drawing.Size(68, 17);
            this.useAlertCheckBox.TabIndex = 7;
            this.useAlertCheckBox.Text = "Use alert";
            this.useAlertCheckBox.ThreeState = true;
            this.helperToolTip.SetToolTip(this.useAlertCheckBox, "Action an alert for commands that support it");
            this.useAlertCheckBox.UseVisualStyleBackColor = true;
            // 
            // trackBar1
            // 
            this.trackBar1.Location = new System.Drawing.Point(3, 228);
            this.trackBar1.Maximum = 29;
            this.trackBar1.Minimum = 10;
            this.trackBar1.Name = "trackBar1";
            this.trackBar1.Size = new System.Drawing.Size(229, 45);
            this.trackBar1.TabIndex = 8;
            this.helperToolTip.SetToolTip(this.trackBar1, "Specifies the maximum output power in dBm from 10 to 29 in commands that support " +
                    "it");
            this.trackBar1.Value = 10;
            // 
            // outputPowerLabel
            // 
            this.outputPowerLabel.AutoSize = true;
            this.outputPowerLabel.Location = new System.Drawing.Point(3, 212);
            this.outputPowerLabel.Name = "outputPowerLabel";
            this.outputPowerLabel.Size = new System.Drawing.Size(105, 13);
            this.outputPowerLabel.TabIndex = 9;
            this.outputPowerLabel.Text = "Carrier Output Power";
            // 
            // CommonParametersUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.outputPowerLabel);
            this.Controls.Add(this.trackBar1);
            this.Controls.Add(this.useAlertCheckBox);
            this.Controls.Add(this.includeTransponderRssiCheckBox);
            this.Controls.Add(this.includeIndexCheckBox);
            this.Controls.Add(this.includePcCheckBox);
            this.Controls.Add(this.includeDateTimeCheckBox);
            this.Controls.Add(this.includeChecksumCheckBox);
            this.Name = "CommonParametersUserControl";
            this.Size = new System.Drawing.Size(255, 292);
            ((System.ComponentModel.ISupportInitialize)(this.trackBar1)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion        
    }
}
