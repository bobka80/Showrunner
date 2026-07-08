//-----------------------------------------------------------------------
// <copyright file="CommandsUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// User control to perform some general commands
    /// </summary>
    public partial class CommandsUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for bindings between ICommand to controls
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// View model to implement the commands
        /// </summary>
        private CommandsViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the CommandsUserControl class
        /// </summary>
        public CommandsUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<CommandsViewModel>();

            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();
                
                this.buzzerEnabledCheckBox.DataBindings.Add("Checked", this.viewModel, "IsBuzzerEnabled");
                this.echoCheckBox.DataBindings.Add("Checked", this.viewModel, "IsEchoEnabled");
                this.vibrateEnabledCheckBox.DataBindings.Add("Checked", this.viewModel, "IsVibrateEnabled");
                this.alertDurationComboBox.DataSource = Enum.GetValues(typeof(AlertDuration));
                this.alertDurationComboBox.DataBindings.Add("SelectedItem", this.viewModel, "AlertDuration");
                this.alertDurationComboBox.FormattingEnabled = true;
                this.alertDurationComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((AlertDuration)e.Value).Description();
                };
                this.buzzerToneComboBox.DataSource = Enum.GetValues(typeof(BuzzerTone));
                this.buzzerToneComboBox.DataBindings.Add("SelectedItem", this.viewModel, "BuzzerTone");
                this.buzzerToneComboBox.FormattingEnabled = true;
                this.buzzerToneComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((BuzzerTone)e.Value).Description();
                };

                this.commandBindings.Add(new ButtonBinder(this.abortCommandButton, this.viewModel.AbortCommand));
                this.commandBindings.Add(new ButtonBinder(this.alertButton, this.viewModel.AlertCommand));
                this.commandBindings.Add(new ButtonBinder(this.alertApplyButton, this.viewModel.AlertApplyCommand));
                this.commandBindings.Add(new ButtonBinder(this.alertReadButton, this.viewModel.AlertReadCommand));
                this.commandBindings.Add(new ButtonBinder(this.batteryStatusButton, this.viewModel.BatteryStatusCommand));
                this.commandBindings.Add(new ButtonBinder(this.echoApplyButton, this.viewModel.EchoApplyCommand));
                this.commandBindings.Add(new ButtonBinder(this.echoReadButton, this.viewModel.EchoReadCommand));
                this.commandBindings.Add(new ButtonBinder(this.factoryDefaultsButton, this.viewModel.FactoryDefaultsCommand));
                this.commandBindings.Add(new ButtonBinder(this.sleepButton, this.viewModel.SleepCommand));
                this.commandBindings.Add(new ButtonBinder(this.versionButton, this.viewModel.VersionCommand));
            }
        }
    }
}
