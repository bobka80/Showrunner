namespace TechnologySolutions.AsciiProtocolSample.Views
{
    public partial class BarcodeUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.GroupBox barcodeGroupBox;
        private System.Windows.Forms.Button scanBarcodeAsynchronousButton;
        private System.Windows.Forms.Button scanBarcodeButton;
        private System.Windows.Forms.NumericUpDown scanTimeNumericUpDown;
        private System.Windows.Forms.Label timeoutLabel;

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
            this.barcodeGroupBox = new System.Windows.Forms.GroupBox();
            this.scanTimeNumericUpDown = new System.Windows.Forms.NumericUpDown();
            this.scanBarcodeAsynchronousButton = new System.Windows.Forms.Button();
            this.scanBarcodeButton = new System.Windows.Forms.Button();
            this.timeoutLabel = new System.Windows.Forms.Label();
            this.barcodeGroupBox.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.scanTimeNumericUpDown)).BeginInit();
            this.SuspendLayout();
            // 
            // barcodeGroupBox
            // 
            this.barcodeGroupBox.Controls.Add(this.timeoutLabel);
            this.barcodeGroupBox.Controls.Add(this.scanTimeNumericUpDown);
            this.barcodeGroupBox.Controls.Add(this.scanBarcodeAsynchronousButton);
            this.barcodeGroupBox.Controls.Add(this.scanBarcodeButton);
            this.barcodeGroupBox.Location = new System.Drawing.Point(3, 0);
            this.barcodeGroupBox.Name = "barcodeGroupBox";
            this.barcodeGroupBox.Size = new System.Drawing.Size(205, 149);
            this.barcodeGroupBox.TabIndex = 2;
            this.barcodeGroupBox.TabStop = false;
            this.barcodeGroupBox.Text = "Barcode";
            // 
            // scanTimeNumericUpDown
            // 
            this.scanTimeNumericUpDown.Location = new System.Drawing.Point(9, 38);
            this.scanTimeNumericUpDown.Maximum = new decimal(new int[] {
            9,
            0,
            0,
            0});
            this.scanTimeNumericUpDown.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.scanTimeNumericUpDown.Name = "scanTimeNumericUpDown";
            this.scanTimeNumericUpDown.Size = new System.Drawing.Size(190, 20);
            this.scanTimeNumericUpDown.TabIndex = 16;
            this.scanTimeNumericUpDown.Value = new decimal(new int[] {
            1,
            0,
            0,
            0});
            // 
            // scanBarcodeAsynchronousButton
            // 
            this.scanBarcodeAsynchronousButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanBarcodeAsynchronousButton.Location = new System.Drawing.Point(6, 120);
            this.scanBarcodeAsynchronousButton.Name = "scanBarcodeAsynchronousButton";
            this.scanBarcodeAsynchronousButton.Size = new System.Drawing.Size(193, 23);
            this.scanBarcodeAsynchronousButton.TabIndex = 15;
            this.scanBarcodeAsynchronousButton.Text = "Scan (Async)";
            this.scanBarcodeAsynchronousButton.UseVisualStyleBackColor = true;
            // 
            // scanBarcodeButton
            // 
            this.scanBarcodeButton.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.scanBarcodeButton.Location = new System.Drawing.Point(6, 91);
            this.scanBarcodeButton.Name = "scanBarcodeButton";
            this.scanBarcodeButton.Size = new System.Drawing.Size(193, 23);
            this.scanBarcodeButton.TabIndex = 8;
            this.scanBarcodeButton.Text = "Scan";
            this.scanBarcodeButton.UseVisualStyleBackColor = true;
            // 
            // label1
            // 
            this.timeoutLabel.AutoSize = true;
            this.timeoutLabel.Location = new System.Drawing.Point(6, 22);
            this.timeoutLabel.Name = "label1";
            this.timeoutLabel.Size = new System.Drawing.Size(119, 13);
            this.timeoutLabel.TabIndex = 17;
            this.timeoutLabel.Text = "Maximum Scan Time (s)";
            // 
            // BarcodeUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.barcodeGroupBox);
            this.Name = "BarcodeUserControl";
            this.Size = new System.Drawing.Size(211, 156);
            this.barcodeGroupBox.ResumeLayout(false);
            this.barcodeGroupBox.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.scanTimeNumericUpDown)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion                
    }
}
