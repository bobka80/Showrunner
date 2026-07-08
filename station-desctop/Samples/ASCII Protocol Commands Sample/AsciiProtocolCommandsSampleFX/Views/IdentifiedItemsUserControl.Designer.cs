namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class IdentifiedItemsUserControl
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
            this.clearButton = new System.Windows.Forms.Button();
            this.saveButton = new System.Windows.Forms.Button();
            this.passUniqueTitleLabel = new System.Windows.Forms.Label();
            this.passTotalTitleLabel = new System.Windows.Forms.Label();
            this.passCountLabel = new System.Windows.Forms.Label();
            this.uniqueTranspondersTitleLabel = new System.Windows.Forms.Label();
            this.totalTranspondersTitleLabel = new System.Windows.Forms.Label();
            this.itemsTreeView = new System.Windows.Forms.TreeView();
            this.flowLayoutPanel2 = new System.Windows.Forms.FlowLayoutPanel();
            this.tableLayoutPanel1 = new System.Windows.Forms.TableLayoutPanel();
            this.flowLayoutPanel2.SuspendLayout();
            this.tableLayoutPanel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // clearButton
            // 
            this.clearButton.Location = new System.Drawing.Point(3, 578);
            this.clearButton.Name = "clearButton";
            this.clearButton.Size = new System.Drawing.Size(75, 23);
            this.clearButton.TabIndex = 1;
            this.clearButton.Text = "Clear";
            this.clearButton.UseVisualStyleBackColor = true;
            // 
            // saveButton
            // 
            this.saveButton.Location = new System.Drawing.Point(297, 578);
            this.saveButton.Name = "saveButton";
            this.saveButton.Size = new System.Drawing.Size(75, 23);
            this.saveButton.TabIndex = 2;
            this.saveButton.Text = "Save";
            this.saveButton.UseVisualStyleBackColor = true;
            // 
            // passUniqueTitleLabel
            // 
            this.passUniqueTitleLabel.AutoSize = true;
            this.passUniqueTitleLabel.Location = new System.Drawing.Point(3, 0);
            this.passUniqueTitleLabel.MinimumSize = new System.Drawing.Size(100, 20);
            this.passUniqueTitleLabel.Name = "passUniqueTitleLabel";
            this.passUniqueTitleLabel.Size = new System.Drawing.Size(100, 20);
            this.passUniqueTitleLabel.TabIndex = 4;
            this.passUniqueTitleLabel.Text = "0 Pass Unique";
            // 
            // passTotalTitleLabel
            // 
            this.passTotalTitleLabel.AutoSize = true;
            this.passTotalTitleLabel.Location = new System.Drawing.Point(109, 0);
            this.passTotalTitleLabel.MinimumSize = new System.Drawing.Size(100, 20);
            this.passTotalTitleLabel.Name = "passTotalTitleLabel";
            this.passTotalTitleLabel.Size = new System.Drawing.Size(100, 20);
            this.passTotalTitleLabel.TabIndex = 5;
            this.passTotalTitleLabel.Text = "100 Pass Total";
            // 
            // PassCountTitleLabel
            // 
            this.passCountLabel.AutoSize = true;
            this.passCountLabel.Location = new System.Drawing.Point(215, 0);
            this.passCountLabel.MinimumSize = new System.Drawing.Size(100, 20);
            this.passCountLabel.Name = "PassCountTitleLabel";
            this.passCountLabel.Size = new System.Drawing.Size(100, 20);
            this.passCountLabel.TabIndex = 13;
            this.passCountLabel.Text = "Pass Count";
            // 
            // uniqueTranspondersTitleLabel
            // 
            this.uniqueTranspondersTitleLabel.AutoSize = true;
            this.uniqueTranspondersTitleLabel.Location = new System.Drawing.Point(321, 0);
            this.uniqueTranspondersTitleLabel.MinimumSize = new System.Drawing.Size(100, 20);
            this.uniqueTranspondersTitleLabel.Name = "uniqueTranspondersTitleLabel";
            this.uniqueTranspondersTitleLabel.Size = new System.Drawing.Size(109, 20);
            this.uniqueTranspondersTitleLabel.TabIndex = 8;
            this.uniqueTranspondersTitleLabel.Text = "Unique Transponders";
            // 
            // totalTranspondersTitleLabel
            // 
            this.totalTranspondersTitleLabel.AutoSize = true;
            this.totalTranspondersTitleLabel.Location = new System.Drawing.Point(436, 0);
            this.totalTranspondersTitleLabel.MinimumSize = new System.Drawing.Size(100, 20);
            this.totalTranspondersTitleLabel.Name = "totalTranspondersTitleLabel";
            this.totalTranspondersTitleLabel.Size = new System.Drawing.Size(100, 20);
            this.totalTranspondersTitleLabel.TabIndex = 9;
            this.totalTranspondersTitleLabel.Text = "Total Transponders";
            // 
            // itemsTreeView
            // 
            this.tableLayoutPanel1.SetColumnSpan(this.itemsTreeView, 2);
            this.itemsTreeView.Dock = System.Windows.Forms.DockStyle.Fill;
            this.itemsTreeView.Location = new System.Drawing.Point(3, 109);
            this.itemsTreeView.Name = "itemsTreeView";
            this.itemsTreeView.Size = new System.Drawing.Size(583, 463);
            this.itemsTreeView.TabIndex = 4;
            // 
            // flowLayoutPanel2
            // 
            this.tableLayoutPanel1.SetColumnSpan(this.flowLayoutPanel2, 2);
            this.flowLayoutPanel2.Controls.Add(this.passUniqueTitleLabel);
            this.flowLayoutPanel2.Controls.Add(this.passTotalTitleLabel);
            this.flowLayoutPanel2.Controls.Add(this.passCountLabel);
            this.flowLayoutPanel2.Controls.Add(this.uniqueTranspondersTitleLabel);
            this.flowLayoutPanel2.Controls.Add(this.totalTranspondersTitleLabel);
            this.flowLayoutPanel2.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel2.Location = new System.Drawing.Point(3, 3);
            this.flowLayoutPanel2.Name = "flowLayoutPanel2";
            this.flowLayoutPanel2.Size = new System.Drawing.Size(583, 100);
            this.flowLayoutPanel2.TabIndex = 10;
            // 
            // tableLayoutPanel1
            // 
            this.tableLayoutPanel1.ColumnCount = 2;
            this.tableLayoutPanel1.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.Controls.Add(this.flowLayoutPanel2, 0, 0);
            this.tableLayoutPanel1.Controls.Add(this.saveButton, 1, 2);
            this.tableLayoutPanel1.Controls.Add(this.itemsTreeView, 0, 1);
            this.tableLayoutPanel1.Controls.Add(this.clearButton, 0, 2);
            this.tableLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayoutPanel1.Location = new System.Drawing.Point(0, 0);
            this.tableLayoutPanel1.Name = "tableLayoutPanel1";
            this.tableLayoutPanel1.RowCount = 3;
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle());
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 100F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 30F));
            this.tableLayoutPanel1.Size = new System.Drawing.Size(589, 605);
            this.tableLayoutPanel1.TabIndex = 11;
            // 
            // IdentifiedItemsUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.tableLayoutPanel1);
            this.Name = "IdentifiedItemsUserControl";
            this.Size = new System.Drawing.Size(589, 605);
            this.flowLayoutPanel2.ResumeLayout(false);
            this.flowLayoutPanel2.PerformLayout();
            this.tableLayoutPanel1.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button clearButton;
        private System.Windows.Forms.Button saveButton;
        private System.Windows.Forms.Label passUniqueTitleLabel;
        private System.Windows.Forms.Label passTotalTitleLabel;
        private System.Windows.Forms.Label uniqueTranspondersTitleLabel;
        private System.Windows.Forms.Label totalTranspondersTitleLabel;
        private System.Windows.Forms.Label passCountLabel;
        private System.Windows.Forms.TreeView itemsTreeView;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel2;
        private System.Windows.Forms.TableLayoutPanel tableLayoutPanel1;
    }
}
