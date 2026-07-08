//-----------------------------------------------------------------------
// <copyright file="ConfigureReaderUserControl.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;    
    using System.Data;
    using System.Drawing;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using TechnologySolutions.ModelViewViewModel.Views;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using ViewModels;

    /// <summary>
    /// Provides commands to configure the reader
    /// </summary>
    public partial class ConfigureReaderUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for bindings between ICommand to controls
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// View model to implement the commands
        /// </summary>
        private ConfigureReaderViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the ConfigureReaderUserControl class
        /// </summary>
        public ConfigureReaderUserControl()
        {
            this.InitializeComponent();
            
            this.viewModel = ViewModelLocator.ViewModel<ConfigureReaderViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                // alert settings
                this.buzzerEnabledCheckBox.DataBindings.Add("Checked", this.viewModel, "IsBuzzerEnabled");
                this.vibrateEnabledCheckBox.DataBindings.Add("Checked", this.viewModel, "IsVibrateEnabled");
                this.alertDurationComboBox.DataSource = this.viewModel.AlertDurations;
                this.alertDurationComboBox.DataBindings.Add("SelectedItem", this.viewModel, "AlertDuration");
                this.alertDurationComboBox.FormattingEnabled = true;
                this.alertDurationComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((AlertDuration)e.Value).Description();
                };
                this.buzzerToneComboBox.DataSource = this.viewModel.BuzzerTones;
                this.buzzerToneComboBox.DataBindings.Add("SelectedItem", this.viewModel, "BuzzerTone");
                this.buzzerToneComboBox.FormattingEnabled = true;
                this.buzzerToneComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((BuzzerTone)e.Value).Description();
                };

                this.commandBindings.Bind(this.alertApplyButton, this.viewModel.AlertApplyCommand);
                this.commandBindings.Bind(this.alertReadButton, this.viewModel.AlertReadCommand);

                // echo
                this.echoCheckBox.DataBindings.Add("Checked", this.viewModel, "IsEchoEnabled");
                this.commandBindings.Bind(this.echoApplyButton, this.viewModel.EchoApplyCommand);
                this.commandBindings.Bind(this.echoReadButton, this.viewModel.EchoReadCommand);

                // factory defaults
                this.commandBindings.Bind(this.factoryDefaultsButton, this.viewModel.FactoryDefaultsCommand);

                // date time
                this.commandBindings.Bind(this.readDateTimeButton, this.viewModel.ReadDateTimeCommand);
                this.commandBindings.Bind(this.writeDateTimeButton, this.viewModel.WriteDateTimeCommand);

                // sleep timeout
                this.sleepTimeoutNumericUpDown.DataBindings.Add("Value", this.viewModel, "SleepTimeout");
                this.commandBindings.Bind(this.readSleepTimeoutButton, this.viewModel.ReadSleepTimeoutCommand);
                this.commandBindings.Bind(this.writeSleepTimeoutButton, this.viewModel.WriteSleepTimeoutCommand);

                // bluetooth
                this.bundleIdentifierTextBox.DataBindings.Add("Text", this.viewModel, "BluetoothBundleIdentifier");
                this.bundleSeedTextBox.DataBindings.Add("Text", this.viewModel, "BluetoothBundleSeed");
                this.friendlyNameTextBox.DataBindings.Add("Text", this.viewModel, "BluetoothFriendlyName");
                this.pinTextBox.DataBindings.Add("Text", this.viewModel, "BluetoothPin");
                this.commandBindings.Bind(this.readBluetoothButton, this.viewModel.ReadBluetoothCommand);
                this.commandBindings.Bind(this.applyBluetoothButton, this.viewModel.WriteBluetoothCommand);
                this.commandBindings.Bind(this.resetBluetoothButton, this.viewModel.ResetBluetoothCommand);
            }
        }
    }
}
