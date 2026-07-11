namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class QueryParametersUserControl
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
            this.queryGroupBox = new System.Windows.Forms.GroupBox();
            this.querySessionComboBox = new System.Windows.Forms.ComboBox();
            this.querySessionLabel = new System.Windows.Forms.Label();
            this.querySelectComboBox = new System.Windows.Forms.ComboBox();
            this.querySelectLabel = new System.Windows.Forms.Label();
            this.queryTargetComboBox = new System.Windows.Forms.ComboBox();
            this.queryTargetLabel = new System.Windows.Forms.Label();
            this.queryGroupBox.SuspendLayout();
            this.SuspendLayout();
            // 
            // queryGroupBox
            // 
            this.queryGroupBox.Controls.Add(this.querySessionComboBox);
            this.queryGroupBox.Controls.Add(this.querySessionLabel);
            this.queryGroupBox.Controls.Add(this.querySelectComboBox);
            this.queryGroupBox.Controls.Add(this.querySelectLabel);
            this.queryGroupBox.Controls.Add(this.queryTargetComboBox);
            this.queryGroupBox.Controls.Add(this.queryTargetLabel);
            this.queryGroupBox.Location = new System.Drawing.Point(3, 3);
            this.queryGroupBox.Name = "queryGroupBox";
            this.queryGroupBox.Size = new System.Drawing.Size(258, 97);
            this.queryGroupBox.TabIndex = 6;
            this.queryGroupBox.TabStop = false;
            this.queryGroupBox.Text = "Query Parameters";
            // 
            // querySessionComboBox
            // 
            this.querySessionComboBox.FormattingEnabled = true;
            this.querySessionComboBox.Location = new System.Drawing.Point(61, 46);
            this.querySessionComboBox.Name = "querySessionComboBox";
            this.querySessionComboBox.Size = new System.Drawing.Size(191, 21);
            this.querySessionComboBox.TabIndex = 28;
            // 
            // querySessionLabel
            // 
            this.querySessionLabel.AutoSize = true;
            this.querySessionLabel.Location = new System.Drawing.Point(18, 49);
            this.querySessionLabel.Name = "querySessionLabel";
            this.querySessionLabel.Size = new System.Drawing.Size(44, 13);
            this.querySessionLabel.TabIndex = 29;
            this.querySessionLabel.Text = "Session";
            // 
            // querySelectComboBox
            // 
            this.querySelectComboBox.FormattingEnabled = true;
            this.querySelectComboBox.Location = new System.Drawing.Point(61, 19);
            this.querySelectComboBox.Name = "querySelectComboBox";
            this.querySelectComboBox.Size = new System.Drawing.Size(191, 21);
            this.querySelectComboBox.TabIndex = 26;
            // 
            // querySelectLabel
            // 
            this.querySelectLabel.AutoSize = true;
            this.querySelectLabel.Location = new System.Drawing.Point(18, 22);
            this.querySelectLabel.Name = "querySelectLabel";
            this.querySelectLabel.Size = new System.Drawing.Size(37, 13);
            this.querySelectLabel.TabIndex = 27;
            this.querySelectLabel.Text = "Select";
            // 
            // queryTargetComboBox
            // 
            this.queryTargetComboBox.FormattingEnabled = true;
            this.queryTargetComboBox.Location = new System.Drawing.Point(61, 73);
            this.queryTargetComboBox.Name = "queryTargetComboBox";
            this.queryTargetComboBox.Size = new System.Drawing.Size(191, 21);
            this.queryTargetComboBox.TabIndex = 24;
            // 
            // queryTargetLabel
            // 
            this.queryTargetLabel.AutoSize = true;
            this.queryTargetLabel.Location = new System.Drawing.Point(18, 76);
            this.queryTargetLabel.Name = "queryTargetLabel";
            this.queryTargetLabel.Size = new System.Drawing.Size(38, 13);
            this.queryTargetLabel.TabIndex = 25;
            this.queryTargetLabel.Text = "Target";
            // 
            // QueryParametersUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.queryGroupBox);
            this.Name = "QueryParametersUserControl";
            this.Size = new System.Drawing.Size(264, 108);
            this.queryGroupBox.ResumeLayout(false);
            this.queryGroupBox.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox queryGroupBox;
        private System.Windows.Forms.ComboBox querySessionComboBox;
        private System.Windows.Forms.Label querySessionLabel;
        private System.Windows.Forms.ComboBox querySelectComboBox;
        private System.Windows.Forms.Label querySelectLabel;
        private System.Windows.Forms.ComboBox queryTargetComboBox;
        private System.Windows.Forms.Label queryTargetLabel;

    }
}
