namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class SettingsUserControl
    {
        private System.Windows.Forms.Label descriptionLabel;
        private System.Windows.Forms.TextBox companyTextBox;
        private System.Windows.Forms.TextBox secretTextBox;
        private System.Windows.Forms.Label companyLabel;
        private System.Windows.Forms.Label secretLabel;
        private System.Windows.Forms.Button applyButton;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel1;

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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(SettingsUserControl));
            this.descriptionLabel = new System.Windows.Forms.Label();
            this.companyTextBox = new System.Windows.Forms.TextBox();
            this.secretTextBox = new System.Windows.Forms.TextBox();
            this.companyLabel = new System.Windows.Forms.Label();
            this.secretLabel = new System.Windows.Forms.Label();
            this.applyButton = new System.Windows.Forms.Button();
            this.flowLayoutPanel1 = new System.Windows.Forms.FlowLayoutPanel();
            this.flowLayoutPanel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // descriptionLabel
            // 
            this.descriptionLabel.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.descriptionLabel.Location = new System.Drawing.Point(3, 85);
            this.descriptionLabel.Name = "descriptionLabel";
            this.descriptionLabel.Size = new System.Drawing.Size(234, 87);
            this.descriptionLabel.TabIndex = 17;
            this.descriptionLabel.Text = resources.GetString("descriptionLabel.Text");
            this.descriptionLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // companyTextBox
            // 
            this.companyTextBox.Location = new System.Drawing.Point(3, 62);
            this.companyTextBox.Name = "companyTextBox";
            this.companyTextBox.Size = new System.Drawing.Size(234, 20);
            this.companyTextBox.TabIndex = 19;
            // 
            // secretTextBox
            // 
            this.secretTextBox.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.secretTextBox.Location = new System.Drawing.Point(3, 16);
            this.secretTextBox.Name = "secretTextBox";
            this.secretTextBox.Size = new System.Drawing.Size(234, 20);
            this.secretTextBox.TabIndex = 18;
            // 
            // companyLabel
            // 
            this.companyLabel.Location = new System.Drawing.Point(3, 39);
            this.companyLabel.Name = "companyLabel";
            this.companyLabel.Size = new System.Drawing.Size(234, 20);
            this.companyLabel.TabIndex = 20;
            this.companyLabel.Text = "Company Name";
            this.companyLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // secretLabel
            // 
            this.secretLabel.AutoSize = true;
            this.secretLabel.Location = new System.Drawing.Point(3, 0);
            this.secretLabel.Name = "secretLabel";
            this.secretLabel.Size = new System.Drawing.Size(38, 13);
            this.secretLabel.TabIndex = 21;
            this.secretLabel.Text = "Secret";
            this.secretLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // applyButton
            // 
            this.applyButton.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left)
                        | System.Windows.Forms.AnchorStyles.Right)));
            this.applyButton.Location = new System.Drawing.Point(3, 175);
            this.applyButton.Name = "applyButton";
            this.applyButton.Size = new System.Drawing.Size(234, 23);
            this.applyButton.TabIndex = 22;
            this.applyButton.Text = "&Apply";
            this.applyButton.UseVisualStyleBackColor = true;
            this.applyButton.Click += new System.EventHandler(this.ApplyButton_Click);
            // 
            // flowLayoutPanel1
            // 
            this.flowLayoutPanel1.AutoSize = true;
            this.flowLayoutPanel1.Controls.Add(this.secretLabel);
            this.flowLayoutPanel1.Controls.Add(this.secretTextBox);
            this.flowLayoutPanel1.Controls.Add(this.companyLabel);
            this.flowLayoutPanel1.Controls.Add(this.companyTextBox);
            this.flowLayoutPanel1.Controls.Add(this.descriptionLabel);
            this.flowLayoutPanel1.Controls.Add(this.applyButton);
            this.flowLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel1.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flowLayoutPanel1.Location = new System.Drawing.Point(0, 0);
            this.flowLayoutPanel1.Name = "flowLayoutPanel1";
            this.flowLayoutPanel1.Size = new System.Drawing.Size(248, 217);
            this.flowLayoutPanel1.TabIndex = 23;
            // 
            // SettingsUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.flowLayoutPanel1);
            this.Name = "SettingsUserControl";
            this.Size = new System.Drawing.Size(248, 217);
            this.flowLayoutPanel1.ResumeLayout(false);
            this.flowLayoutPanel1.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion        
    }
}
