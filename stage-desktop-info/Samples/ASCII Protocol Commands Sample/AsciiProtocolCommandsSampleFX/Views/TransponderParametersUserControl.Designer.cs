namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class TransponderParametersUserControl
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
            this.includeTransponderRssiCheckBox = new System.Windows.Forms.CheckBox();
            this.includeIndexCheckBox = new System.Windows.Forms.CheckBox();
            this.includePcCheckBox = new System.Windows.Forms.CheckBox();
            this.includeChecksumCheckBox = new System.Windows.Forms.CheckBox();
            this.SuspendLayout();
            // 
            // includeTransponderRssiCheckBox
            // 
            this.includeTransponderRssiCheckBox.AutoSize = true;
            this.includeTransponderRssiCheckBox.Location = new System.Drawing.Point(3, 72);
            this.includeTransponderRssiCheckBox.Name = "includeTransponderRssiCheckBox";
            this.includeTransponderRssiCheckBox.Size = new System.Drawing.Size(148, 17);
            this.includeTransponderRssiCheckBox.TabIndex = 10;
            this.includeTransponderRssiCheckBox.Text = "Include transponder RSSI";
            this.includeTransponderRssiCheckBox.ThreeState = true;
            this.includeTransponderRssiCheckBox.UseVisualStyleBackColor = true;
            // 
            // includeIndexCheckBox
            // 
            this.includeIndexCheckBox.AutoSize = true;
            this.includeIndexCheckBox.Location = new System.Drawing.Point(3, 26);
            this.includeIndexCheckBox.Name = "includeIndexCheckBox";
            this.includeIndexCheckBox.Size = new System.Drawing.Size(89, 17);
            this.includeIndexCheckBox.TabIndex = 9;
            this.includeIndexCheckBox.Text = "Include index";
            this.includeIndexCheckBox.ThreeState = true;
            this.includeIndexCheckBox.UseVisualStyleBackColor = true;
            // 
            // includePcCheckBox
            // 
            this.includePcCheckBox.AutoSize = true;
            this.includePcCheckBox.Location = new System.Drawing.Point(3, 49);
            this.includePcCheckBox.Name = "includePcCheckBox";
            this.includePcCheckBox.Size = new System.Drawing.Size(78, 17);
            this.includePcCheckBox.TabIndex = 8;
            this.includePcCheckBox.Text = "Include PC";
            this.includePcCheckBox.ThreeState = true;
            this.includePcCheckBox.UseVisualStyleBackColor = true;
            // 
            // includeChecksumCheckBox
            // 
            this.includeChecksumCheckBox.AutoSize = true;
            this.includeChecksumCheckBox.Location = new System.Drawing.Point(3, 3);
            this.includeChecksumCheckBox.Name = "includeChecksumCheckBox";
            this.includeChecksumCheckBox.Size = new System.Drawing.Size(113, 17);
            this.includeChecksumCheckBox.TabIndex = 7;
            this.includeChecksumCheckBox.Text = "Include checksum";
            this.includeChecksumCheckBox.ThreeState = true;
            this.includeChecksumCheckBox.UseVisualStyleBackColor = true;
            // 
            // TransponderParametersUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.includeTransponderRssiCheckBox);
            this.Controls.Add(this.includeIndexCheckBox);
            this.Controls.Add(this.includePcCheckBox);
            this.Controls.Add(this.includeChecksumCheckBox);
            this.Name = "TransponderParametersUserControl";
            this.Size = new System.Drawing.Size(166, 99);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.CheckBox includeTransponderRssiCheckBox;
        private System.Windows.Forms.CheckBox includeIndexCheckBox;
        private System.Windows.Forms.CheckBox includePcCheckBox;
        private System.Windows.Forms.CheckBox includeChecksumCheckBox;
    }
}
