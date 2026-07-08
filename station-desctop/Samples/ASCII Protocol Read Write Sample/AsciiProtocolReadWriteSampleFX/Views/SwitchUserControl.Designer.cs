namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class SwitchUserControl
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
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.readSwitchStateButton = new System.Windows.Forms.Button();
            this.switchDurationNumericUpDown = new System.Windows.Forms.NumericUpDown();
            this.switchSinglePressButton = new System.Windows.Forms.Button();
            this.switchDoublePressButton = new System.Windows.Forms.Button();
            this.groupBox1.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.switchDurationNumericUpDown)).BeginInit();
            this.SuspendLayout();
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.readSwitchStateButton);
            this.groupBox1.Controls.Add(this.switchDurationNumericUpDown);
            this.groupBox1.Controls.Add(this.switchSinglePressButton);
            this.groupBox1.Controls.Add(this.switchDoublePressButton);
            this.groupBox1.Location = new System.Drawing.Point(3, 3);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(220, 129);
            this.groupBox1.TabIndex = 3;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Switch";
            // 
            // readSwitchStateButton
            // 
            this.readSwitchStateButton.Location = new System.Drawing.Point(12, 77);
            this.readSwitchStateButton.Name = "readSwitchStateButton";
            this.readSwitchStateButton.Size = new System.Drawing.Size(141, 23);
            this.readSwitchStateButton.TabIndex = 5;
            this.readSwitchStateButton.Text = "Read Switch State";
            this.readSwitchStateButton.UseVisualStyleBackColor = true;
            // 
            // switchDurationNumericUpDown
            // 
            this.switchDurationNumericUpDown.Location = new System.Drawing.Point(159, 19);
            this.switchDurationNumericUpDown.Maximum = new decimal(new int[] {
            99,
            0,
            0,
            0});
            this.switchDurationNumericUpDown.Name = "switchDurationNumericUpDown";
            this.switchDurationNumericUpDown.Size = new System.Drawing.Size(44, 20);
            this.switchDurationNumericUpDown.TabIndex = 4;
            // 
            // switchSinglePressButton
            // 
            this.switchSinglePressButton.Location = new System.Drawing.Point(12, 19);
            this.switchSinglePressButton.Name = "switchSinglePressButton";
            this.switchSinglePressButton.Size = new System.Drawing.Size(141, 23);
            this.switchSinglePressButton.TabIndex = 1;
            this.switchSinglePressButton.Text = "Single Press";
            this.switchSinglePressButton.UseVisualStyleBackColor = true;
            // 
            // switchDoublePressButton
            // 
            this.switchDoublePressButton.Location = new System.Drawing.Point(12, 48);
            this.switchDoublePressButton.Name = "switchDoublePressButton";
            this.switchDoublePressButton.Size = new System.Drawing.Size(141, 23);
            this.switchDoublePressButton.TabIndex = 2;
            this.switchDoublePressButton.Text = "Double Press";
            this.switchDoublePressButton.UseVisualStyleBackColor = true;
            // 
            // SwitchUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.groupBox1);
            this.Name = "SwitchUserControl";
            this.Size = new System.Drawing.Size(227, 140);
            this.groupBox1.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.switchDurationNumericUpDown)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Button readSwitchStateButton;
        private System.Windows.Forms.NumericUpDown switchDurationNumericUpDown;
        private System.Windows.Forms.Button switchSinglePressButton;
        private System.Windows.Forms.Button switchDoublePressButton;
    }
}
