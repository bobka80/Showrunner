namespace TechnologySolutions.AsciiProtocolSample.Views
{
    public partial class MainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.ListBox outputListBox;
        private System.Windows.Forms.CheckBox authorisedOnlyCheckBox;
        private System.Windows.Forms.StatusStrip statusStrip1;
        private System.Windows.Forms.MenuStrip menuStrip1;
        private System.Windows.Forms.ToolStripMenuItem fileToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem exitToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem helpToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem aboutToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem readerToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem authoriseToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem deauthoriseToolStripMenuItem;
        private System.Windows.Forms.Button inventoryButton;
        private System.Windows.Forms.Button barcodeButton;
        private System.Windows.Forms.ToolStripStatusLabel connectionToolStripStatusLabel;
        private SettingsUserControl settingsUserControl1;
        private System.Windows.Forms.ToolStripStatusLabel authorisationToolStripStatusLabel;
        private System.Windows.Forms.ToolStripMenuItem viewToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem clearMessagesToolStripMenuItem;
        private System.Windows.Forms.ToolStripSeparator toolStripMenuItem1;
        private System.Windows.Forms.ToolStripMenuItem connectToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem disconnectToolStripMenuItem;
        private System.Windows.Forms.ComboBox connectionNameComboBox;
        private System.Windows.Forms.Label label1;

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

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.outputListBox = new System.Windows.Forms.ListBox();
            this.authorisedOnlyCheckBox = new System.Windows.Forms.CheckBox();
            this.statusStrip1 = new System.Windows.Forms.StatusStrip();
            this.connectionToolStripStatusLabel = new System.Windows.Forms.ToolStripStatusLabel();
            this.authorisationToolStripStatusLabel = new System.Windows.Forms.ToolStripStatusLabel();
            this.menuStrip1 = new System.Windows.Forms.MenuStrip();
            this.fileToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.exitToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.readerToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.authoriseToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.deauthoriseToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.toolStripMenuItem1 = new System.Windows.Forms.ToolStripSeparator();
            this.connectToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.disconnectToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.viewToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.clearMessagesToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.helpToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.aboutToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.inventoryButton = new System.Windows.Forms.Button();
            this.barcodeButton = new System.Windows.Forms.Button();
            this.connectionNameComboBox = new System.Windows.Forms.ComboBox();
            this.settingsUserControl1 = new TechnologySolutions.AsciiProtocolSample.Views.SettingsUserControl();
            this.label1 = new System.Windows.Forms.Label();
            this.statusStrip1.SuspendLayout();
            this.menuStrip1.SuspendLayout();
            this.SuspendLayout();
            // 
            // outputListBox
            // 
            this.outputListBox.Location = new System.Drawing.Point(12, 122);
            this.outputListBox.Name = "outputListBox";
            this.outputListBox.Size = new System.Drawing.Size(237, 160);
            this.outputListBox.TabIndex = 4;
            // 
            // authorisedOnlyCheckBox
            // 
            this.authorisedOnlyCheckBox.Location = new System.Drawing.Point(12, 328);
            this.authorisedOnlyCheckBox.Name = "authorisedOnlyCheckBox";
            this.authorisedOnlyCheckBox.Size = new System.Drawing.Size(237, 20);
            this.authorisedOnlyCheckBox.TabIndex = 5;
            this.authorisedOnlyCheckBox.Text = "Only respond to authorised readers";
            this.authorisedOnlyCheckBox.CheckStateChanged += new System.EventHandler(this.SynchronousCheckBox_CheckStateChanged);
            // 
            // statusStrip1
            // 
            this.statusStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.connectionToolStripStatusLabel,
            this.authorisationToolStripStatusLabel});
            this.statusStrip1.Location = new System.Drawing.Point(0, 429);
            this.statusStrip1.Name = "statusStrip1";
            this.statusStrip1.Size = new System.Drawing.Size(605, 22);
            this.statusStrip1.TabIndex = 10;
            this.statusStrip1.Text = "statusStrip1";
            // 
            // connectionToolStripStatusLabel
            // 
            this.connectionToolStripStatusLabel.Name = "connectionToolStripStatusLabel";
            this.connectionToolStripStatusLabel.Size = new System.Drawing.Size(101, 17);
            this.connectionToolStripStatusLabel.Text = "connection status";
            // 
            // authorisationToolStripStatusLabel
            // 
            this.authorisationToolStripStatusLabel.Name = "authorisationToolStripStatusLabel";
            this.authorisationToolStripStatusLabel.Size = new System.Drawing.Size(111, 17);
            this.authorisationToolStripStatusLabel.Text = "authroisation status";
            // 
            // menuStrip1
            // 
            this.menuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.fileToolStripMenuItem,
            this.readerToolStripMenuItem,
            this.viewToolStripMenuItem,
            this.helpToolStripMenuItem});
            this.menuStrip1.Location = new System.Drawing.Point(0, 0);
            this.menuStrip1.Name = "menuStrip1";
            this.menuStrip1.Size = new System.Drawing.Size(605, 24);
            this.menuStrip1.TabIndex = 11;
            this.menuStrip1.Text = "menuStrip1";
            // 
            // fileToolStripMenuItem
            // 
            this.fileToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.exitToolStripMenuItem});
            this.fileToolStripMenuItem.Name = "fileToolStripMenuItem";
            this.fileToolStripMenuItem.Size = new System.Drawing.Size(37, 20);
            this.fileToolStripMenuItem.Text = "&File";
            // 
            // exitToolStripMenuItem
            // 
            this.exitToolStripMenuItem.Name = "exitToolStripMenuItem";
            this.exitToolStripMenuItem.Size = new System.Drawing.Size(92, 22);
            this.exitToolStripMenuItem.Text = "E&xit";
            this.exitToolStripMenuItem.Click += new System.EventHandler(this.ExitToolStripMenuItem_Click);
            // 
            // readerToolStripMenuItem
            // 
            this.readerToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.authoriseToolStripMenuItem,
            this.deauthoriseToolStripMenuItem,
            this.toolStripMenuItem1,
            this.connectToolStripMenuItem,
            this.disconnectToolStripMenuItem});
            this.readerToolStripMenuItem.Name = "readerToolStripMenuItem";
            this.readerToolStripMenuItem.Size = new System.Drawing.Size(55, 20);
            this.readerToolStripMenuItem.Text = "&Reader";
            // 
            // authoriseToolStripMenuItem
            // 
            this.authoriseToolStripMenuItem.Name = "authoriseToolStripMenuItem";
            this.authoriseToolStripMenuItem.Size = new System.Drawing.Size(152, 22);
            this.authoriseToolStripMenuItem.Text = "&Authorise";
            this.authoriseToolStripMenuItem.Click += new System.EventHandler(this.AuthoriseToolStripMenuItem_Click);
            // 
            // deauthoriseToolStripMenuItem
            // 
            this.deauthoriseToolStripMenuItem.Name = "deauthoriseToolStripMenuItem";
            this.deauthoriseToolStripMenuItem.Size = new System.Drawing.Size(152, 22);
            this.deauthoriseToolStripMenuItem.Text = "Deauthori&se";
            this.deauthoriseToolStripMenuItem.Click += new System.EventHandler(this.DeauthoriseToolStripMenuItem_Click);
            // 
            // toolStripMenuItem1
            // 
            this.toolStripMenuItem1.Name = "toolStripMenuItem1";
            this.toolStripMenuItem1.Size = new System.Drawing.Size(149, 6);
            // 
            // connectToolStripMenuItem
            // 
            this.connectToolStripMenuItem.Name = "connectToolStripMenuItem";
            this.connectToolStripMenuItem.Size = new System.Drawing.Size(152, 22);
            this.connectToolStripMenuItem.Text = "&Connect";
            this.connectToolStripMenuItem.Click += new System.EventHandler(this.ConnectToolStripMenuItem_Click);
            // 
            // disconnectToolStripMenuItem
            // 
            this.disconnectToolStripMenuItem.Name = "disconnectToolStripMenuItem";
            this.disconnectToolStripMenuItem.Size = new System.Drawing.Size(152, 22);
            this.disconnectToolStripMenuItem.Text = "&Disconnect";
            this.disconnectToolStripMenuItem.Click += new System.EventHandler(this.DisconnectToolStripMenuItem_Click);
            // 
            // viewToolStripMenuItem
            // 
            this.viewToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.clearMessagesToolStripMenuItem});
            this.viewToolStripMenuItem.Name = "viewToolStripMenuItem";
            this.viewToolStripMenuItem.Size = new System.Drawing.Size(44, 20);
            this.viewToolStripMenuItem.Text = "&View";
            // 
            // clearMessagesToolStripMenuItem
            // 
            this.clearMessagesToolStripMenuItem.Name = "clearMessagesToolStripMenuItem";
            this.clearMessagesToolStripMenuItem.Size = new System.Drawing.Size(155, 22);
            this.clearMessagesToolStripMenuItem.Text = "Clear &Messages";
            this.clearMessagesToolStripMenuItem.Click += new System.EventHandler(this.ClearMessagesToolStripMenuItem_Click);
            // 
            // helpToolStripMenuItem
            // 
            this.helpToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.aboutToolStripMenuItem});
            this.helpToolStripMenuItem.Name = "helpToolStripMenuItem";
            this.helpToolStripMenuItem.Size = new System.Drawing.Size(44, 20);
            this.helpToolStripMenuItem.Text = "&Help";
            // 
            // aboutToolStripMenuItem
            // 
            this.aboutToolStripMenuItem.Name = "aboutToolStripMenuItem";
            this.aboutToolStripMenuItem.Size = new System.Drawing.Size(116, 22);
            this.aboutToolStripMenuItem.Text = "&About...";
            // 
            // inventoryButton
            // 
            this.inventoryButton.Location = new System.Drawing.Point(12, 288);
            this.inventoryButton.Name = "inventoryButton";
            this.inventoryButton.Size = new System.Drawing.Size(75, 23);
            this.inventoryButton.TabIndex = 12;
            this.inventoryButton.Text = "Inventory";
            this.inventoryButton.UseVisualStyleBackColor = true;
            this.inventoryButton.Click += new System.EventHandler(this.InventoryButton_Click);
            // 
            // barcodeButton
            // 
            this.barcodeButton.Location = new System.Drawing.Point(93, 288);
            this.barcodeButton.Name = "barcodeButton";
            this.barcodeButton.Size = new System.Drawing.Size(75, 23);
            this.barcodeButton.TabIndex = 13;
            this.barcodeButton.Text = "Barcode";
            this.barcodeButton.UseVisualStyleBackColor = true;
            this.barcodeButton.Click += new System.EventHandler(this.BarcodeButton_Click);
            // 
            // connectionNameComboBox
            // 
            this.connectionNameComboBox.FormattingEnabled = true;
            this.connectionNameComboBox.Location = new System.Drawing.Point(12, 53);
            this.connectionNameComboBox.Name = "connectionNameComboBox";
            this.connectionNameComboBox.Size = new System.Drawing.Size(237, 21);
            this.connectionNameComboBox.TabIndex = 16;
            // 
            // settingsUserControl1
            // 
            this.settingsUserControl1.Location = new System.Drawing.Point(308, 65);
            this.settingsUserControl1.Name = "settingsUserControl1";
            this.settingsUserControl1.Size = new System.Drawing.Size(248, 217);
            this.settingsUserControl1.TabIndex = 15;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(12, 37);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(95, 13);
            this.label1.TabIndex = 17;
            this.label1.Text = "Connection Name:";
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(96F, 96F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Dpi;
            this.AutoScroll = true;
            this.ClientSize = new System.Drawing.Size(605, 451);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.connectionNameComboBox);
            this.Controls.Add(this.settingsUserControl1);
            this.Controls.Add(this.barcodeButton);
            this.Controls.Add(this.inventoryButton);
            this.Controls.Add(this.statusStrip1);
            this.Controls.Add(this.menuStrip1);
            this.Controls.Add(this.authorisedOnlyCheckBox);
            this.Controls.Add(this.outputListBox);
            this.MainMenuStrip = this.menuStrip1;
            this.Name = "MainForm";
            this.Text = "Licence Key";
            this.statusStrip1.ResumeLayout(false);
            this.statusStrip1.PerformLayout();
            this.menuStrip1.ResumeLayout(false);
            this.menuStrip1.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion                        
    }
}

