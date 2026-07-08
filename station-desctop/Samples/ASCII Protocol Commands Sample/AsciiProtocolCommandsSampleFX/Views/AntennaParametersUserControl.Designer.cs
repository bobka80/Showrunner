namespace TechnologySolutions.AsciiProtocolSample.Views
{
    public partial class AntennaParametersUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.ToolTip helperToolTip;
        private System.Windows.Forms.TrackBar outputPowerTrackBar;
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
            this.helperToolTip = new System.Windows.Forms.ToolTip(this.components);
            this.outputPowerTrackBar = new System.Windows.Forms.TrackBar();
            this.outputPowerLabel = new System.Windows.Forms.Label();
            ((System.ComponentModel.ISupportInitialize)(this.outputPowerTrackBar)).BeginInit();
            this.SuspendLayout();
            // 
            // outputPowerTrackBar
            // 
            this.outputPowerTrackBar.Location = new System.Drawing.Point(3, 16);
            this.outputPowerTrackBar.Maximum = 29;
            this.outputPowerTrackBar.Minimum = 10;
            this.outputPowerTrackBar.Name = "outputPowerTrackBar";
            this.outputPowerTrackBar.Size = new System.Drawing.Size(229, 45);
            this.outputPowerTrackBar.TabIndex = 8;
            this.helperToolTip.SetToolTip(this.outputPowerTrackBar, "Specifies the maximum output power in dBm from 10 to 29 in commands that support " +
                    "it");
            this.outputPowerTrackBar.Value = 10;
            // 
            // outputPowerLabel
            // 
            this.outputPowerLabel.AutoSize = true;
            this.outputPowerLabel.Location = new System.Drawing.Point(3, 0);
            this.outputPowerLabel.Name = "outputPowerLabel";
            this.outputPowerLabel.Size = new System.Drawing.Size(105, 13);
            this.outputPowerLabel.TabIndex = 9;
            this.outputPowerLabel.Text = "Carrier Output Power";
            // 
            // AntennaParametersUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.outputPowerLabel);
            this.Controls.Add(this.outputPowerTrackBar);
            this.Name = "AntennaParametersUserControl";
            this.Size = new System.Drawing.Size(255, 61);
            ((System.ComponentModel.ISupportInitialize)(this.outputPowerTrackBar)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion        
    }
}
