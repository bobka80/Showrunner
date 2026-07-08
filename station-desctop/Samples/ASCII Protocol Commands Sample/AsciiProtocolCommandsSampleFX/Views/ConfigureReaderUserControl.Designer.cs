namespace TechnologySolutions.AsciiProtocolSample.Views
{
    partial class ConfigureReaderUserControl
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
            this.components = new System.ComponentModel.Container();
            this.alertGroupBox = new System.Windows.Forms.GroupBox();
            this.alertApplyButton = new System.Windows.Forms.Button();
            this.alertReadButton = new System.Windows.Forms.Button();
            this.alertDurationComboBox = new System.Windows.Forms.ComboBox();
            this.buzzerToneComboBox = new System.Windows.Forms.ComboBox();
            this.buzzerEnabledCheckBox = new System.Windows.Forms.CheckBox();
            this.vibrateEnabledCheckBox = new System.Windows.Forms.CheckBox();
            this.echoGroupBox = new System.Windows.Forms.GroupBox();
            this.echoCheckBox = new System.Windows.Forms.CheckBox();
            this.echoApplyButton = new System.Windows.Forms.Button();
            this.echoReadButton = new System.Windows.Forms.Button();
            this.flowLayoutPanel1 = new System.Windows.Forms.FlowLayoutPanel();
            this.sleepTimeoutGroupBox = new System.Windows.Forms.GroupBox();
            this.writeSleepTimeoutButton = new System.Windows.Forms.Button();
            this.readSleepTimeoutButton = new System.Windows.Forms.Button();
            this.sleepTimeoutNumericUpDown = new System.Windows.Forms.NumericUpDown();
            this.bluetoothGroupBox = new System.Windows.Forms.GroupBox();
            this.bundleSeedTextBox = new System.Windows.Forms.TextBox();
            this.bundleSeedLabel = new System.Windows.Forms.Label();
            this.bundleIdentifierTextBox = new System.Windows.Forms.TextBox();
            this.bundleIdentifierLabel = new System.Windows.Forms.Label();
            this.resetBluetoothButton = new System.Windows.Forms.Button();
            this.readBluetoothButton = new System.Windows.Forms.Button();
            this.applyBluetoothButton = new System.Windows.Forms.Button();
            this.pinTextBox = new System.Windows.Forms.TextBox();
            this.friendlyNameTextBox = new System.Windows.Forms.TextBox();
            this.pinLabel = new System.Windows.Forms.Label();
            this.friendlyNameLabel = new System.Windows.Forms.Label();
            this.factoryDefaultsButton = new System.Windows.Forms.Button();
            this.readDateTimeButton = new System.Windows.Forms.Button();
            this.writeDateTimeButton = new System.Windows.Forms.Button();
            this.helperToolTip = new System.Windows.Forms.ToolTip(this.components);
            this.alertGroupBox.SuspendLayout();
            this.echoGroupBox.SuspendLayout();
            this.flowLayoutPanel1.SuspendLayout();
            this.sleepTimeoutGroupBox.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.sleepTimeoutNumericUpDown)).BeginInit();
            this.bluetoothGroupBox.SuspendLayout();
            this.SuspendLayout();
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
            this.alertGroupBox.TabIndex = 17;
            this.alertGroupBox.TabStop = false;
            this.alertGroupBox.Text = "Alert";
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
            // alertReadButton
            // 
            this.alertReadButton.Location = new System.Drawing.Point(6, 119);
            this.alertReadButton.Name = "alertReadButton";
            this.alertReadButton.Size = new System.Drawing.Size(135, 23);
            this.alertReadButton.TabIndex = 7;
            this.alertReadButton.Text = "Read Alert";
            this.alertReadButton.UseVisualStyleBackColor = true;
            // 
            // alertDurationComboBox
            // 
            this.alertDurationComboBox.FormattingEnabled = true;
            this.alertDurationComboBox.Location = new System.Drawing.Point(6, 92);
            this.alertDurationComboBox.Name = "alertDurationComboBox";
            this.alertDurationComboBox.Size = new System.Drawing.Size(138, 21);
            this.alertDurationComboBox.TabIndex = 11;
            this.helperToolTip.SetToolTip(this.alertDurationComboBox, "Gets or sets the duration of the alert");
            // 
            // buzzerToneComboBox
            // 
            this.buzzerToneComboBox.FormattingEnabled = true;
            this.buzzerToneComboBox.Location = new System.Drawing.Point(6, 65);
            this.buzzerToneComboBox.Name = "buzzerToneComboBox";
            this.buzzerToneComboBox.Size = new System.Drawing.Size(138, 21);
            this.buzzerToneComboBox.TabIndex = 12;
            this.helperToolTip.SetToolTip(this.buzzerToneComboBox, "Gets or sets the tone of the buzzer");
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
            // echoGroupBox
            // 
            this.echoGroupBox.Controls.Add(this.echoCheckBox);
            this.echoGroupBox.Controls.Add(this.echoApplyButton);
            this.echoGroupBox.Controls.Add(this.echoReadButton);
            this.echoGroupBox.Location = new System.Drawing.Point(323, 3);
            this.echoGroupBox.Name = "echoGroupBox";
            this.echoGroupBox.Size = new System.Drawing.Size(148, 102);
            this.echoGroupBox.TabIndex = 18;
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
            // echoReadButton
            // 
            this.echoReadButton.Location = new System.Drawing.Point(6, 42);
            this.echoReadButton.Name = "echoReadButton";
            this.echoReadButton.Size = new System.Drawing.Size(129, 23);
            this.echoReadButton.TabIndex = 15;
            this.echoReadButton.Text = "Read Echo";
            this.echoReadButton.UseVisualStyleBackColor = true;
            // 
            // flowLayoutPanel1
            // 
            this.flowLayoutPanel1.Controls.Add(this.alertGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.sleepTimeoutGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.bluetoothGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.echoGroupBox);
            this.flowLayoutPanel1.Controls.Add(this.factoryDefaultsButton);
            this.flowLayoutPanel1.Controls.Add(this.readDateTimeButton);
            this.flowLayoutPanel1.Controls.Add(this.writeDateTimeButton);
            this.flowLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel1.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flowLayoutPanel1.Location = new System.Drawing.Point(0, 0);
            this.flowLayoutPanel1.Name = "flowLayoutPanel1";
            this.flowLayoutPanel1.Size = new System.Drawing.Size(495, 314);
            this.flowLayoutPanel1.TabIndex = 19;
            // 
            // sleepTimeoutGroupBox
            // 
            this.sleepTimeoutGroupBox.Controls.Add(this.writeSleepTimeoutButton);
            this.sleepTimeoutGroupBox.Controls.Add(this.readSleepTimeoutButton);
            this.sleepTimeoutGroupBox.Controls.Add(this.sleepTimeoutNumericUpDown);
            this.sleepTimeoutGroupBox.Location = new System.Drawing.Point(3, 190);
            this.sleepTimeoutGroupBox.Name = "sleepTimeoutGroupBox";
            this.sleepTimeoutGroupBox.Size = new System.Drawing.Size(154, 104);
            this.sleepTimeoutGroupBox.TabIndex = 22;
            this.sleepTimeoutGroupBox.TabStop = false;
            this.sleepTimeoutGroupBox.Text = "Sleep Timeout";
            // 
            // writeSleepTimeoutButton
            // 
            this.writeSleepTimeoutButton.Location = new System.Drawing.Point(3, 71);
            this.writeSleepTimeoutButton.Name = "writeSleepTimeoutButton";
            this.writeSleepTimeoutButton.Size = new System.Drawing.Size(138, 23);
            this.writeSleepTimeoutButton.TabIndex = 2;
            this.writeSleepTimeoutButton.Text = "Apply Sleep Timeout";
            this.writeSleepTimeoutButton.UseVisualStyleBackColor = true;
            // 
            // readSleepTimeoutButton
            // 
            this.readSleepTimeoutButton.Location = new System.Drawing.Point(3, 42);
            this.readSleepTimeoutButton.Name = "readSleepTimeoutButton";
            this.readSleepTimeoutButton.Size = new System.Drawing.Size(138, 23);
            this.readSleepTimeoutButton.TabIndex = 1;
            this.readSleepTimeoutButton.Text = "Read Sleep Timeout";
            this.readSleepTimeoutButton.UseVisualStyleBackColor = true;
            // 
            // sleepTimeoutNumericUpDown
            // 
            this.sleepTimeoutNumericUpDown.Location = new System.Drawing.Point(3, 16);
            this.sleepTimeoutNumericUpDown.Maximum = new decimal(new int[] {
            999,
            0,
            0,
            0});
            this.sleepTimeoutNumericUpDown.Minimum = new decimal(new int[] {
            15,
            0,
            0,
            0});
            this.sleepTimeoutNumericUpDown.Name = "sleepTimeoutNumericUpDown";
            this.sleepTimeoutNumericUpDown.Size = new System.Drawing.Size(138, 20);
            this.sleepTimeoutNumericUpDown.TabIndex = 0;
            this.sleepTimeoutNumericUpDown.Value = new decimal(new int[] {
            50,
            0,
            0,
            0});
            // 
            // bluetoothGroupBox
            // 
            this.bluetoothGroupBox.Controls.Add(this.bundleSeedTextBox);
            this.bluetoothGroupBox.Controls.Add(this.bundleSeedLabel);
            this.bluetoothGroupBox.Controls.Add(this.bundleIdentifierTextBox);
            this.bluetoothGroupBox.Controls.Add(this.bundleIdentifierLabel);
            this.bluetoothGroupBox.Controls.Add(this.resetBluetoothButton);
            this.bluetoothGroupBox.Controls.Add(this.readBluetoothButton);
            this.bluetoothGroupBox.Controls.Add(this.applyBluetoothButton);
            this.bluetoothGroupBox.Controls.Add(this.pinTextBox);
            this.bluetoothGroupBox.Controls.Add(this.friendlyNameTextBox);
            this.bluetoothGroupBox.Controls.Add(this.pinLabel);
            this.bluetoothGroupBox.Controls.Add(this.friendlyNameLabel);
            this.bluetoothGroupBox.Location = new System.Drawing.Point(163, 3);
            this.bluetoothGroupBox.Name = "bluetoothGroupBox";
            this.bluetoothGroupBox.Size = new System.Drawing.Size(154, 291);
            this.bluetoothGroupBox.TabIndex = 23;
            this.bluetoothGroupBox.TabStop = false;
            this.bluetoothGroupBox.Text = "Bluetooth";
            // 
            // bundleSeedTextBox
            // 
            this.bundleSeedTextBox.Location = new System.Drawing.Point(6, 161);
            this.bundleSeedTextBox.Name = "bundleSeedTextBox";
            this.bundleSeedTextBox.Size = new System.Drawing.Size(142, 20);
            this.bundleSeedTextBox.TabIndex = 10;
            // 
            // bundleSeedLabel
            // 
            this.bundleSeedLabel.AutoSize = true;
            this.bundleSeedLabel.Location = new System.Drawing.Point(6, 142);
            this.bundleSeedLabel.Name = "bundleSeedLabel";
            this.bundleSeedLabel.Size = new System.Drawing.Size(68, 13);
            this.bundleSeedLabel.TabIndex = 9;
            this.bundleSeedLabel.Text = "Bundle Seed";
            // 
            // bundleIdentifierTextBox
            // 
            this.bundleIdentifierTextBox.Location = new System.Drawing.Point(6, 116);
            this.bundleIdentifierTextBox.Name = "bundleIdentifierTextBox";
            this.bundleIdentifierTextBox.Size = new System.Drawing.Size(142, 20);
            this.bundleIdentifierTextBox.TabIndex = 8;
            // 
            // bundleIdentifierLabel
            // 
            this.bundleIdentifierLabel.AutoSize = true;
            this.bundleIdentifierLabel.Location = new System.Drawing.Point(6, 100);
            this.bundleIdentifierLabel.Name = "bundleIdentifierLabel";
            this.bundleIdentifierLabel.Size = new System.Drawing.Size(83, 13);
            this.bundleIdentifierLabel.TabIndex = 7;
            this.bundleIdentifierLabel.Text = "Bundle Identifier";
            // 
            // resetBluetoothButton
            // 
            this.resetBluetoothButton.Location = new System.Drawing.Point(6, 258);
            this.resetBluetoothButton.Name = "resetBluetoothButton";
            this.resetBluetoothButton.Size = new System.Drawing.Size(142, 23);
            this.resetBluetoothButton.TabIndex = 6;
            this.resetBluetoothButton.Text = "Reset to Default";
            this.helperToolTip.SetToolTip(this.resetBluetoothButton, "Reset Bluetooth to its defaults");
            this.resetBluetoothButton.UseVisualStyleBackColor = true;
            // 
            // readBluetoothButton
            // 
            this.readBluetoothButton.Location = new System.Drawing.Point(6, 200);
            this.readBluetoothButton.Name = "readBluetoothButton";
            this.readBluetoothButton.Size = new System.Drawing.Size(142, 23);
            this.readBluetoothButton.TabIndex = 5;
            this.readBluetoothButton.Text = "Read Bluetooth";
            this.helperToolTip.SetToolTip(this.readBluetoothButton, "Read the current Bluetooth settings");
            this.readBluetoothButton.UseVisualStyleBackColor = true;
            // 
            // applyBluetoothButton
            // 
            this.applyBluetoothButton.Location = new System.Drawing.Point(6, 229);
            this.applyBluetoothButton.Name = "applyBluetoothButton";
            this.applyBluetoothButton.Size = new System.Drawing.Size(142, 23);
            this.applyBluetoothButton.TabIndex = 4;
            this.applyBluetoothButton.Text = "Apply Bluetooth";
            this.helperToolTip.SetToolTip(this.applyBluetoothButton, "Apply the changes to the Bluetooth settings");
            this.applyBluetoothButton.UseVisualStyleBackColor = true;
            // 
            // pinTextBox
            // 
            this.pinTextBox.Location = new System.Drawing.Point(6, 76);
            this.pinTextBox.Name = "pinTextBox";
            this.pinTextBox.Size = new System.Drawing.Size(142, 20);
            this.pinTextBox.TabIndex = 3;
            // 
            // friendlyNameTextBox
            // 
            this.friendlyNameTextBox.Location = new System.Drawing.Point(6, 32);
            this.friendlyNameTextBox.Name = "friendlyNameTextBox";
            this.friendlyNameTextBox.Size = new System.Drawing.Size(142, 20);
            this.friendlyNameTextBox.TabIndex = 2;
            // 
            // pinLabel
            // 
            this.pinLabel.AutoSize = true;
            this.pinLabel.Location = new System.Drawing.Point(6, 55);
            this.pinLabel.Name = "pinLabel";
            this.pinLabel.Size = new System.Drawing.Size(93, 13);
            this.pinLabel.TabIndex = 1;
            this.pinLabel.Text = "PIN (4 characters)";
            // 
            // friendlyNameLabel
            // 
            this.friendlyNameLabel.AutoSize = true;
            this.friendlyNameLabel.Location = new System.Drawing.Point(6, 16);
            this.friendlyNameLabel.Name = "friendlyNameLabel";
            this.friendlyNameLabel.Size = new System.Drawing.Size(74, 13);
            this.friendlyNameLabel.TabIndex = 0;
            this.friendlyNameLabel.Text = "Friendly Name";
            // 
            // factoryDefaultsButton
            // 
            this.factoryDefaultsButton.Location = new System.Drawing.Point(323, 111);
            this.factoryDefaultsButton.Name = "factoryDefaultsButton";
            this.factoryDefaultsButton.Size = new System.Drawing.Size(154, 23);
            this.factoryDefaultsButton.TabIndex = 19;
            this.factoryDefaultsButton.Text = "Factory Defaults";
            this.factoryDefaultsButton.UseVisualStyleBackColor = true;
            // 
            // readDateTimeButton
            // 
            this.readDateTimeButton.Location = new System.Drawing.Point(323, 140);
            this.readDateTimeButton.Name = "readDateTimeButton";
            this.readDateTimeButton.Size = new System.Drawing.Size(154, 23);
            this.readDateTimeButton.TabIndex = 20;
            this.readDateTimeButton.Text = "Get Date and Time";
            this.readDateTimeButton.UseVisualStyleBackColor = true;
            // 
            // writeDateTimeButton
            // 
            this.writeDateTimeButton.Location = new System.Drawing.Point(323, 169);
            this.writeDateTimeButton.Name = "writeDateTimeButton";
            this.writeDateTimeButton.Size = new System.Drawing.Size(154, 23);
            this.writeDateTimeButton.TabIndex = 21;
            this.writeDateTimeButton.Text = "Set Date and Time";
            this.writeDateTimeButton.UseVisualStyleBackColor = true;
            // 
            // ConfigureReaderUserControl
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.flowLayoutPanel1);
            this.Name = "ConfigureReaderUserControl";
            this.Size = new System.Drawing.Size(495, 314);
            this.alertGroupBox.ResumeLayout(false);
            this.alertGroupBox.PerformLayout();
            this.echoGroupBox.ResumeLayout(false);
            this.echoGroupBox.PerformLayout();
            this.flowLayoutPanel1.ResumeLayout(false);
            this.sleepTimeoutGroupBox.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.sleepTimeoutNumericUpDown)).EndInit();
            this.bluetoothGroupBox.ResumeLayout(false);
            this.bluetoothGroupBox.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox alertGroupBox;
        private System.Windows.Forms.Button alertApplyButton;
        private System.Windows.Forms.Button alertReadButton;
        private System.Windows.Forms.ComboBox alertDurationComboBox;
        private System.Windows.Forms.ComboBox buzzerToneComboBox;
        private System.Windows.Forms.CheckBox buzzerEnabledCheckBox;
        private System.Windows.Forms.CheckBox vibrateEnabledCheckBox;
        private System.Windows.Forms.GroupBox echoGroupBox;
        private System.Windows.Forms.CheckBox echoCheckBox;
        private System.Windows.Forms.Button echoApplyButton;
        private System.Windows.Forms.Button echoReadButton;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel1;
        private System.Windows.Forms.Button factoryDefaultsButton;
        private System.Windows.Forms.Button readDateTimeButton;
        private System.Windows.Forms.Button writeDateTimeButton;
        private System.Windows.Forms.GroupBox sleepTimeoutGroupBox;
        private System.Windows.Forms.Button writeSleepTimeoutButton;
        private System.Windows.Forms.Button readSleepTimeoutButton;
        private System.Windows.Forms.NumericUpDown sleepTimeoutNumericUpDown;
        private System.Windows.Forms.ToolTip helperToolTip;
        private System.Windows.Forms.GroupBox bluetoothGroupBox;
        private System.Windows.Forms.Button resetBluetoothButton;
        private System.Windows.Forms.Button readBluetoothButton;
        private System.Windows.Forms.Button applyBluetoothButton;
        private System.Windows.Forms.TextBox pinTextBox;
        private System.Windows.Forms.TextBox friendlyNameTextBox;
        private System.Windows.Forms.Label pinLabel;
        private System.Windows.Forms.Label friendlyNameLabel;
        private System.Windows.Forms.TextBox bundleSeedTextBox;
        private System.Windows.Forms.Label bundleSeedLabel;
        private System.Windows.Forms.TextBox bundleIdentifierTextBox;
        private System.Windows.Forms.Label bundleIdentifierLabel;
    }
}
