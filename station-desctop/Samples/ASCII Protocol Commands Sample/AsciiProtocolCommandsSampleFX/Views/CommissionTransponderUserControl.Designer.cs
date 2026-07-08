namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class CommissionTransponderUserControl
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
            this.changeEpcGroupBox = new System.Windows.Forms.GroupBox();
            this.changeEpcButton = new System.Windows.Forms.Button();
            this.requiredEpcTextBox = new System.Windows.Forms.TextBox();
            this.currentEpcTextBox = new System.Windows.Forms.TextBox();
            this.requiredEpcLabel = new System.Windows.Forms.Label();
            this.currentEpcLabel = new System.Windows.Forms.Label();
            this.changeEpcGroupBox.SuspendLayout();
            this.SuspendLayout();
            // 
            // changeEpcGroupBox
            // 
            this.changeEpcGroupBox.Controls.Add(this.changeEpcButton);
            this.changeEpcGroupBox.Controls.Add(this.requiredEpcTextBox);
            this.changeEpcGroupBox.Controls.Add(this.currentEpcTextBox);
            this.changeEpcGroupBox.Controls.Add(this.requiredEpcLabel);
            this.changeEpcGroupBox.Controls.Add(this.currentEpcLabel);
            this.changeEpcGroupBox.Location = new System.Drawing.Point(3, 3);
            this.changeEpcGroupBox.Name = "changeEpcGroupBox";
            this.changeEpcGroupBox.Size = new System.Drawing.Size(289, 104);
            this.changeEpcGroupBox.TabIndex = 19;
            this.changeEpcGroupBox.TabStop = false;
            this.changeEpcGroupBox.Text = "Change EPC";
            // 
            // changeEpcButton
            // 
            this.changeEpcButton.Location = new System.Drawing.Point(9, 71);
            this.changeEpcButton.Name = "changeEpcButton";
            this.changeEpcButton.Size = new System.Drawing.Size(268, 23);
            this.changeEpcButton.TabIndex = 4;
            this.changeEpcButton.Text = "Change EPC";
            this.changeEpcButton.UseVisualStyleBackColor = true;
            // 
            // requiredEpcTextBox
            // 
            this.requiredEpcTextBox.Location = new System.Drawing.Point(86, 45);
            this.requiredEpcTextBox.Name = "requiredEpcTextBox";
            this.requiredEpcTextBox.Size = new System.Drawing.Size(191, 20);
            this.requiredEpcTextBox.TabIndex = 3;
            this.requiredEpcTextBox.Text = "111122223333444455556666";
            // 
            // currentEpcTextBox
            // 
            this.currentEpcTextBox.Location = new System.Drawing.Point(86, 19);
            this.currentEpcTextBox.Name = "currentEpcTextBox";
            this.currentEpcTextBox.Size = new System.Drawing.Size(191, 20);
            this.currentEpcTextBox.TabIndex = 2;
            // 
            // requiredEpcLabel
            // 
            this.requiredEpcLabel.AutoSize = true;
            this.requiredEpcLabel.Location = new System.Drawing.Point(6, 48);
            this.requiredEpcLabel.Name = "requiredEpcLabel";
            this.requiredEpcLabel.Size = new System.Drawing.Size(74, 13);
            this.requiredEpcLabel.TabIndex = 1;
            this.requiredEpcLabel.Text = "Required EPC";
            // 
            // currentEpcLabel
            // 
            this.currentEpcLabel.AutoSize = true;
            this.currentEpcLabel.Location = new System.Drawing.Point(6, 26);
            this.currentEpcLabel.Name = "currentEpcLabel";
            this.currentEpcLabel.Size = new System.Drawing.Size(65, 13);
            this.currentEpcLabel.TabIndex = 0;
            this.currentEpcLabel.Text = "Current EPC";
            // 
            // CommissionTransponderUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.changeEpcGroupBox);
            this.Name = "CommissionTransponderUserControl";
            this.Size = new System.Drawing.Size(299, 115);
            this.changeEpcGroupBox.ResumeLayout(false);
            this.changeEpcGroupBox.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox changeEpcGroupBox;
        private System.Windows.Forms.Button changeEpcButton;
        private System.Windows.Forms.TextBox requiredEpcTextBox;
        private System.Windows.Forms.TextBox currentEpcTextBox;
        private System.Windows.Forms.Label requiredEpcLabel;
        private System.Windows.Forms.Label currentEpcLabel;
    }
}
