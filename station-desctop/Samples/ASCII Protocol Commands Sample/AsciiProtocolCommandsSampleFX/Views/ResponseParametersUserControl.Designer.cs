namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class ResponseParametersUserControl
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
            this.useAlertCheckBox = new System.Windows.Forms.CheckBox();
            this.includeDateTimeCheckBox = new System.Windows.Forms.CheckBox();
            this.SuspendLayout();
            // 
            // useAlertCheckBox
            // 
            this.useAlertCheckBox.AutoSize = true;
            this.useAlertCheckBox.Location = new System.Drawing.Point(3, 26);
            this.useAlertCheckBox.Name = "useAlertCheckBox";
            this.useAlertCheckBox.Size = new System.Drawing.Size(68, 17);
            this.useAlertCheckBox.TabIndex = 9;
            this.useAlertCheckBox.Text = "Use alert";
            this.useAlertCheckBox.ThreeState = true;
            this.useAlertCheckBox.UseVisualStyleBackColor = true;
            // 
            // includeDateTimeCheckBox
            // 
            this.includeDateTimeCheckBox.AutoSize = true;
            this.includeDateTimeCheckBox.Location = new System.Drawing.Point(3, 3);
            this.includeDateTimeCheckBox.Name = "includeDateTimeCheckBox";
            this.includeDateTimeCheckBox.Size = new System.Drawing.Size(159, 17);
            this.includeDateTimeCheckBox.TabIndex = 8;
            this.includeDateTimeCheckBox.Text = "Include date and time stamp";
            this.includeDateTimeCheckBox.ThreeState = true;
            this.includeDateTimeCheckBox.UseVisualStyleBackColor = true;
            // 
            // ResponseParametersUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.useAlertCheckBox);
            this.Controls.Add(this.includeDateTimeCheckBox);
            this.Name = "ResponseParametersUserControl";
            this.Size = new System.Drawing.Size(167, 66);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.CheckBox useAlertCheckBox;
        private System.Windows.Forms.CheckBox includeDateTimeCheckBox;
    }
}
