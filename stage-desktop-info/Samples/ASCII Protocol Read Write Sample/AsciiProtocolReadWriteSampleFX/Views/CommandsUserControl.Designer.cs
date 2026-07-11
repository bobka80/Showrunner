namespace TechnologySolutions.AsciiProtocolSample.Views
{
    public partial class CommandsUserControl
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Button abortCommandButton;
        private System.Windows.Forms.Button factoryDefaultsButton;
        private System.Windows.Forms.Button batteryStatusButton;
        private System.Windows.Forms.Button alertReadButton;
        private System.Windows.Forms.Button alertApplyButton;
        private System.Windows.Forms.CheckBox buzzerEnabledCheckBox;
        private System.Windows.Forms.CheckBox vibrateEnabledCheckBox;
        private System.Windows.Forms.ComboBox alertDurationComboBox;
        private System.Windows.Forms.ComboBox buzzerToneComboBox;
        private System.Windows.Forms.GroupBox alertGroupBox;
        private System.Windows.Forms.Button versionButton;
        private System.Windows.Forms.Button sleepButton;
        private System.Windows.Forms.Button echoReadButton;
        private System.Windows.Forms.GroupBox echoGroupBox;
        private System.Windows.Forms.CheckBox echoCheckBox;
        private System.Windows.Forms.Button echoApplyButton;
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
            this.abortCommandButton = new System.Windows.Forms.Button();
            this.factoryDefaultsButton = new System.Windows.Forms.Button();
            this.batteryStatusButton = new System.Windows.Forms.Button();
            this.alertReadButton = new System.Windows.Forms.Button();
            this.alertApplyButton = new System.Windows.Forms.Button();
            this.buzzerEnabledCheckBox = new System.Windows.Forms.CheckBox();
            this.vibrateEnabledCheckBox = new System.Windows.Forms.CheckBox();
            this.alertDurationComboBox = new System.Windows.Forms.ComboBox();
            this.buzzerToneComboBox = new System.Windows.Forms.ComboBox();
            this.alertGroupBox = new System.Windows.Forms.GroupBox();
            this.versionButton = new System.Windows.Forms.Button();
            this.sleepButton = new System.Windows.Forms.Button();
            this.echoReadButton = new System.Windows.Forms.Button();
            this.echoGroupBox = new System.Windows.Forms.GroupBox();
            this.echoCheckBox = new System.Windows.Forms.CheckBox();
            this.echoApplyButton = new System.Windows.Forms.Button();
            this.commandsFlowLayoutPanel = new System.Windows.Forms.FlowLayoutPanel();
            this.alertButton = new System.Windows.Forms.Button();
            this.alertGroupBox.SuspendLayout();
            this.echoGroupBox.SuspendLayout();
            this.commandsFlowLayoutPanel.SuspendLayout();
            this.SuspendLayout();
            // 
            // abortCommandButton
            // 
            this.abortCommandButton.Location = new System.Drawing.Point(3, 190);
            this.abortCommandButton.Name = "abortCommandButton";
            this.abortCommandButton.Size = new System.Drawing.Size(154, 23);
            this.abortCommandButton.TabIndex = 5;
            this.abortCommandButton.Text = "Abort";
            this.abortCommandButton.UseVisualStyleBackColor = true;
            // 
            // factoryDefaultsButton
            // 
            this.factoryDefaultsButton.Location = new System.Drawing.Point(3, 248);
            this.factoryDefaultsButton.Name = "factoryDefaultsButton";
            this.factoryDefaultsButton.Size = new System.Drawing.Size(154, 23);
            this.factoryDefaultsButton.TabIndex = 4;
            this.factoryDefaultsButton.Text = "Factory Defaults";
            this.factoryDefaultsButton.UseVisualStyleBackColor = true;
            // 
            // batteryStatusButton
            // 
            this.batteryStatusButton.Location = new System.Drawing.Point(3, 277);
            this.batteryStatusButton.Name = "batteryStatusButton";
            this.batteryStatusButton.Size = new System.Drawing.Size(154, 23);
            this.batteryStatusButton.TabIndex = 6;
            this.batteryStatusButton.Text = "Battery Status";
            this.batteryStatusButton.UseVisualStyleBackColor = true;
            // 
            // alertReadButton
            // 
            this.alertReadButton.Location = new System.Drawing.Point(6, 119);
            this.alertReadButton.Name = "alertReadButton";
            this.alertReadButton.Size = new System.Drawing.Size(135, 23);
            this.alertReadButton.TabIndex = 7;
            this.alertReadButton.Text = "Read Alert";
            this.alertReadButton.UseVisualStyleBackColor = true;
            // 
            // alertApplyButton
            // 
            this.alertApplyButton.Location = new System.Drawing.Point(6, 148);
            this.alertApplyButton.Name = "alertApplyButton";
            this.alertApplyButton.Size = new System.Drawing.Size(135, 23);
            this.alertApplyButton.TabIndex = 8;
            this.alertApplyButton.Text = "Apply Alert";
            this.alertApplyButton.UseVisualStyleBackColor = true;
            // 
            // buzzerEnabledCheckBox
            // 
            this.buzzerEnabledCheckBox.AutoSize = true;
            this.buzzerEnabledCheckBox.Location = new System.Drawing.Point(6, 19);
            this.buzzerEnabledCheckBox.Name = "buzzerEnabledCheckBox";
            this.buzzerEnabledCheckBox.Size = new System.Drawing.Size(100, 17);
            this.buzzerEnabledCheckBox.TabIndex = 9;
            this.buzzerEnabledCheckBox.Text = "Buzzer Enabled";
            this.buzzerEnabledCheckBox.UseVisualStyleBackColor = true;
            // 
            // vibrateEnabledCheckBox
            // 
            this.vibrateEnabledCheckBox.AutoSize = true;
            this.vibrateEnabledCheckBox.Location = new System.Drawing.Point(6, 42);
            this.vibrateEnabledCheckBox.Name = "vibrateEnabledCheckBox";
            this.vibrateEnabledCheckBox.Size = new System.Drawing.Size(101, 17);
            this.vibrateEnabledCheckBox.TabIndex = 10;
            this.vibrateEnabledCheckBox.Text = "Vibrate Enabled";
            this.vibrateEnabledCheckBox.UseVisualStyleBackColor = true;
            // 
            // alertDurationComboBox
            // 
            this.alertDurationComboBox.FormattingEnabled = true;
            this.alertDurationComboBox.Location = new System.Drawing.Point(6, 92);
            this.alertDurationComboBox.Name = "alertDurationComboBox";
            this.alertDurationComboBox.Size = new System.Drawing.Size(138, 21);
            this.alertDurationComboBox.TabIndex = 11;
            // 
            // buzzerToneComboBox
            // 
            this.buzzerToneComboBox.FormattingEnabled = true;
            this.buzzerToneComboBox.Location = new System.Drawing.Point(6, 65);
            this.buzzerToneComboBox.Name = "buzzerToneComboBox";
            this.buzzerToneComboBox.Size = new System.Drawing.Size(138, 21);
            this.buzzerToneComboBox.TabIndex = 12;
            // 
            // alertGroupBox
            // 
            this.alertGroupBox.Controls.Add(this.alertApplyButton);
            this.alertGroupBox.Controls.Add(this.alertReadButton);
            this.alertGroupBox.Controls.Add(this.alertDurationComboBox);
            this.alertGroupBox.Controls.Add(this.buzzerToneComboBox);
            this.alertGroupBox.Controls.Add(this.buzzerEnabledCheckBox);
            this.alertGroupBox.Controls.Add(this.vibrateEnabledCheckBox);
            this.alertGroupBox.Location = new System.Drawing.Point(3, 3);
            this.alertGroupBox.Name = "alertGroupBox";
            this.alertGroupBox.Size = new System.Drawing.Size(154, 181);
            this.alertGroupBox.TabIndex = 13;
            this.alertGroupBox.TabStop = false;
            this.alertGroupBox.Text = "Alert";
            // 
            // versionButton
            // 
            this.versionButton.Location = new System.Drawing.Point(163, 3);
            this.versionButton.Name = "versionButton";
            this.versionButton.Size = new System.Drawing.Size(154, 23);
            this.versionButton.TabIndex = 14;
            this.versionButton.Text = "Version";
            this.versionButton.UseVisualStyleBackColor = true;
            // 
            // sleepButton
            // 
            this.sleepButton.Location = new System.Drawing.Point(163, 32);
            this.sleepButton.Name = "sleepButton";
            this.sleepButton.Size = new System.Drawing.Size(154, 23);
            this.sleepButton.TabIndex = 13;
            this.sleepButton.Text = "Sleep";
            this.sleepButton.UseVisualStyleBackColor = true;
            // 
            // echoReadButton
            // 
            this.echoReadButton.Location = new System.Drawing.Point(6, 42);
            this.echoReadButton.Name = "echoReadButton";
            this.echoReadButton.Size = new System.Drawing.Size(129, 23);
            this.echoReadButton.TabIndex = 15;
            this.echoReadButton.Text = "Read Echo";
            this.echoReadButton.UseVisualStyleBackColor = true;
            // 
            // echoGroupBox
            // 
            this.echoGroupBox.Controls.Add(this.echoCheckBox);
            this.echoGroupBox.Controls.Add(this.echoApplyButton);
            this.echoGroupBox.Controls.Add(this.echoReadButton);
            this.echoGroupBox.Location = new System.Drawing.Point(163, 61);
            this.echoGroupBox.Name = "echoGroupBox";
            this.echoGroupBox.Size = new System.Drawing.Size(148, 102);
            this.echoGroupBox.TabIndex = 16;
            this.echoGroupBox.TabStop = false;
            this.echoGroupBox.Text = "Echo";
            // 
            // echoCheckBox
            // 
            this.echoCheckBox.AutoSize = true;
            this.echoCheckBox.Location = new System.Drawing.Point(6, 19);
            this.echoCheckBox.Name = "echoCheckBox";
            this.echoCheckBox.Size = new System.Drawing.Size(93, 17);
            this.echoCheckBox.TabIndex = 17;
            this.echoCheckBox.Text = "Echo Enabled";
            this.echoCheckBox.UseVisualStyleBackColor = true;
            // 
            // echoApplyButton
            // 
            this.echoApplyButton.Location = new System.Drawing.Point(6, 71);
            this.echoApplyButton.Name = "echoApplyButton";
            this.echoApplyButton.Size = new System.Drawing.Size(129, 23);
            this.echoApplyButton.TabIndex = 16;
            this.echoApplyButton.Text = "Apply Echo";
            this.echoApplyButton.UseVisualStyleBackColor = true;
            // 
            // commandsFlowLayoutPanel
            // 
            this.commandsFlowLayoutPanel.Controls.Add(this.alertGroupBox);
            this.commandsFlowLayoutPanel.Controls.Add(this.abortCommandButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.alertButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.factoryDefaultsButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.batteryStatusButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.versionButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.sleepButton);
            this.commandsFlowLayoutPanel.Controls.Add(this.echoGroupBox);
            this.commandsFlowLayoutPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            this.commandsFlowLayoutPanel.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.commandsFlowLayoutPanel.Location = new System.Drawing.Point(0, 0);
            this.commandsFlowLayoutPanel.Name = "commandsFlowLayoutPanel";
            this.commandsFlowLayoutPanel.Size = new System.Drawing.Size(479, 314);
            this.commandsFlowLayoutPanel.TabIndex = 17;
            // 
            // alertButton
            // 
            this.alertButton.Location = new System.Drawing.Point(3, 219);
            this.alertButton.Name = "alertButton";
            this.alertButton.Size = new System.Drawing.Size(154, 23);
            this.alertButton.TabIndex = 17;
            this.alertButton.Text = "Alert";
            this.alertButton.UseVisualStyleBackColor = true;
            // 
            // CommandsUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.commandsFlowLayoutPanel);
            this.Name = "CommandsUserControl";
            this.Size = new System.Drawing.Size(479, 314);
            this.alertGroupBox.ResumeLayout(false);
            this.alertGroupBox.PerformLayout();
            this.echoGroupBox.ResumeLayout(false);
            this.echoGroupBox.PerformLayout();
            this.commandsFlowLayoutPanel.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion                
    }
}
