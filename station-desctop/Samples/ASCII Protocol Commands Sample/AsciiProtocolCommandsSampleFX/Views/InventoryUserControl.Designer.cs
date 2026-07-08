namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class InventoryUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Button scanRfidButton;
        private System.Windows.Forms.Button scanRfidAsyncButton;

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
            this.scanRfidButton = new System.Windows.Forms.Button();
            this.scanRfidAsyncButton = new System.Windows.Forms.Button();
            this.fastIdentifierCheckBox = new System.Windows.Forms.CheckBox();
            this.tagFocusCheckBox = new System.Windows.Forms.CheckBox();
            this.queryParametersUserControl1 = new TechnologySolutions.AsciiProtocolSample.Views.QueryParametersUserControl();
            this.selectParametersUserControl1 = new TechnologySolutions.AsciiProtocolSample.Views.SelectParametersUserControl();
            this.antennaParametersUserControl1 = new TechnologySolutions.AsciiProtocolSample.Views.AntennaParametersUserControl();
            this.flowLayoutPanel1 = new System.Windows.Forms.FlowLayoutPanel();
            this.flowLayoutPanel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // scanRfidButton
            // 
            this.scanRfidButton.Location = new System.Drawing.Point(3, 412);
            this.scanRfidButton.Name = "scanRfidButton";
            this.scanRfidButton.Size = new System.Drawing.Size(264, 23);
            this.scanRfidButton.TabIndex = 5;
            this.scanRfidButton.Text = "Scan";
            this.scanRfidButton.UseVisualStyleBackColor = true;
            // 
            // scanRfidAsyncButton
            // 
            this.scanRfidAsyncButton.Location = new System.Drawing.Point(3, 441);
            this.scanRfidAsyncButton.Name = "scanRfidAsyncButton";
            this.scanRfidAsyncButton.Size = new System.Drawing.Size(266, 23);
            this.scanRfidAsyncButton.TabIndex = 16;
            this.scanRfidAsyncButton.Text = "Scan (Async)";
            this.scanRfidAsyncButton.UseVisualStyleBackColor = true;
            // 
            // fastIdentifierCheckBox
            // 
            this.fastIdentifierCheckBox.AutoSize = true;
            this.fastIdentifierCheckBox.Location = new System.Drawing.Point(3, 470);
            this.fastIdentifierCheckBox.Name = "fastIdentifierCheckBox";
            this.fastIdentifierCheckBox.Size = new System.Drawing.Size(89, 17);
            this.fastIdentifierCheckBox.TabIndex = 17;
            this.fastIdentifierCheckBox.Text = "Fast Identifier";
            this.fastIdentifierCheckBox.ThreeState = true;
            this.fastIdentifierCheckBox.UseVisualStyleBackColor = true;
            // 
            // tagFocusCheckBox
            // 
            this.tagFocusCheckBox.AutoSize = true;
            this.tagFocusCheckBox.Location = new System.Drawing.Point(3, 493);
            this.tagFocusCheckBox.Name = "tagFocusCheckBox";
            this.tagFocusCheckBox.Size = new System.Drawing.Size(77, 17);
            this.tagFocusCheckBox.TabIndex = 18;
            this.tagFocusCheckBox.Text = "Tag Focus";
            this.tagFocusCheckBox.ThreeState = true;
            this.tagFocusCheckBox.UseVisualStyleBackColor = true;
            // 
            // queryParametersUserControl1
            // 
            this.queryParametersUserControl1.Location = new System.Drawing.Point(3, 298);
            this.queryParametersUserControl1.Name = "queryParametersUserControl1";
            this.queryParametersUserControl1.Size = new System.Drawing.Size(264, 108);
            this.queryParametersUserControl1.TabIndex = 3;
            // 
            // selectParametersUserControl1
            // 
            this.selectParametersUserControl1.Location = new System.Drawing.Point(3, 70);
            this.selectParametersUserControl1.Name = "selectParametersUserControl1";
            this.selectParametersUserControl1.Size = new System.Drawing.Size(266, 222);
            this.selectParametersUserControl1.TabIndex = 2;
            // 
            // antennaParametersUserControl1
            // 
            this.antennaParametersUserControl1.Location = new System.Drawing.Point(3, 3);
            this.antennaParametersUserControl1.Name = "antennaParametersUserControl1";
            this.antennaParametersUserControl1.Size = new System.Drawing.Size(255, 61);
            this.antennaParametersUserControl1.TabIndex = 19;
            // 
            // flowLayoutPanel1
            // 
            this.flowLayoutPanel1.AutoSize = true;
            this.flowLayoutPanel1.Controls.Add(this.antennaParametersUserControl1);
            this.flowLayoutPanel1.Controls.Add(this.selectParametersUserControl1);
            this.flowLayoutPanel1.Controls.Add(this.queryParametersUserControl1);
            this.flowLayoutPanel1.Controls.Add(this.scanRfidButton);
            this.flowLayoutPanel1.Controls.Add(this.scanRfidAsyncButton);
            this.flowLayoutPanel1.Controls.Add(this.fastIdentifierCheckBox);
            this.flowLayoutPanel1.Controls.Add(this.tagFocusCheckBox);
            this.flowLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel1.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flowLayoutPanel1.Location = new System.Drawing.Point(0, 0);
            this.flowLayoutPanel1.Name = "flowLayoutPanel1";
            this.flowLayoutPanel1.Size = new System.Drawing.Size(314, 555);
            this.flowLayoutPanel1.TabIndex = 20;
            // 
            // InventoryUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.flowLayoutPanel1);
            this.Name = "InventoryUserControl";
            this.Size = new System.Drawing.Size(314, 555);
            this.flowLayoutPanel1.ResumeLayout(false);
            this.flowLayoutPanel1.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion        

        private SelectParametersUserControl selectParametersUserControl1;
        private QueryParametersUserControl queryParametersUserControl1;
        private System.Windows.Forms.CheckBox fastIdentifierCheckBox;
        private System.Windows.Forms.CheckBox tagFocusCheckBox;
        private AntennaParametersUserControl antennaParametersUserControl1;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel1;
    }
}
