namespace TechnologySolutions.AsciiProtocolSample.Views
{
    public partial class CommandsUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Button abortCommandButton;
        private System.Windows.Forms.Button batteryStatusButton;
        private System.Windows.Forms.Button versionButton;
        private System.Windows.Forms.Button sleepButton;
        private System.Windows.Forms.FlowLayoutPanel commandsFlowLayoutPanel;
        private System.Windows.Forms.Button alertButton;

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
            this.abortCommandButton = new System.Windows.Forms.Button();
            this.batteryStatusButton = new System.Windows.Forms.Button();
            this.versionButton = new System.Windows.Forms.Button();
            this.sleepButton = new System.Windows.Forms.Button();
            this.commandsFlowLayoutPanel = new System.Windows.Forms.FlowLayoutPanel();
            this.alertButton = new System.Windows.Forms.Button();
            this.executeAutorunButton = new System.Windows.Forms.Button();
            this.toolTip1 = new System.Windows.Forms.ToolTip(this.components);
            this.commandsFlowLayoutPanel.SuspendLayout();
            this.SuspendLayout();
            // 
            // abortCommandButton
            // 
            this.abortCommandButton.Location = new System.Drawing.Point(3, 3);
            this.abortCommandButton.Name = "abortCommandButton";
            this.abortCommandButton.Size = new System.Drawing.Size(154, 23);
            this.abortCommandButton.TabIndex = 5;
            this.abortCommandButton.Text = "Abort";
            this.toolTip1.SetToolTip(this.abortCommandButton, "Abort the currently executing command (if abortable)");
            this.abortCommandButton.UseVisualStyleBackColor = true;
            // 
            // batteryStatusButton
            // 
            this.batteryStatusButton.Location = new System.Drawing.Point(3, 90);
            this.batteryStatusButton.Name = "batteryStatusButton";
            this.batteryStatusButton.Size = new System.Drawing.Size(154, 23);
            this.batteryStatusButton.TabIndex = 6;
            this.batteryStatusButton.Text = "Battery Status";
            this.toolTip1.SetToolTip(this.batteryStatusButton, "Read back the battery and charging status");
            this.batteryStatusButton.UseVisualStyleBackColor = true;
            // 
            // versionButton
            // 
            this.versionButton.Location = new System.Drawing.Point(3, 148);
            this.versionButton.Name = "versionButton";
            this.versionButton.Size = new System.Drawing.Size(154, 23);
            this.versionButton.TabIndex = 14;
            this.versionButton.Text = "Version";
            this.toolTip1.SetToolTip(this.versionButton, "Report the various reader versions");
            this.versionButton.UseVisualStyleBackColor = true;
            // 
            // sleepButton
            // 
            this.sleepButton.Location = new System.Drawing.Point(3, 119);
            this.sleepButton.Name = "sleepButton";
            this.sleepButton.Size = new System.Drawing.Size(154, 23);
            this.sleepButton.TabIndex = 13;
            this.sleepButton.Text = "Sleep";
            this.toolTip1.SetToolTip(this.sleepButton, "Command the reader to sleep");
            this.sleepButton.UseVisualStyleBackColor = true;
            // 
            // commandsFlowLayoutPanel
            // 
            this.commandsFlowLayoutPanel.Controls.Add(this.abortCommandButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.alertButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.executeAutorunButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.batteryStatusButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.sleepButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.versionButton);
            this.commandsFlowLayoutPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            this.commandsFlowLayoutPanel.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.commandsFlowLayoutPanel.Location = new System.Drawing.Point(0, 0);
            this.commandsFlowLayoutPanel.Name = "commandsFlowLayoutPanel";
            this.commandsFlowLayoutPanel.Size = new System.Drawing.Size(161, 180);
            this.commandsFlowLayoutPanel.TabIndex = 17;
            // 
            // alertButton
            // 
            this.alertButton.Location = new System.Drawing.Point(3, 32);
            this.alertButton.Name = "alertButton";
            this.alertButton.Size = new System.Drawing.Size(154, 23);
            this.alertButton.TabIndex = 17;
            this.alertButton.Text = "Alert";
            this.toolTip1.SetToolTip(this.alertButton, "Perform an alert (as currently configured)");
            this.alertButton.UseVisualStyleBackColor = true;
            // 
            // executeAutorunButton
            // 
            this.executeAutorunButton.Location = new System.Drawing.Point(3, 61);
            this.executeAutorunButton.Name = "executeAutorunButton";
            this.executeAutorunButton.Size = new System.Drawing.Size(154, 23);
            this.executeAutorunButton.TabIndex = 18;
            this.executeAutorunButton.Text = "Execute Autorun";
            this.toolTip1.SetToolTip(this.executeAutorunButton, "Executes the autorun script stored on the SD card in the reader");
            this.executeAutorunButton.UseVisualStyleBackColor = true;
            // 
            // CommandsUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.commandsFlowLayoutPanel);
            this.Name = "CommandsUserControl";
            this.Size = new System.Drawing.Size(161, 180);
            this.commandsFlowLayoutPanel.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion                

        private System.Windows.Forms.ToolTip toolTip1;
        private System.Windows.Forms.Button executeAutorunButton;
    }
}
