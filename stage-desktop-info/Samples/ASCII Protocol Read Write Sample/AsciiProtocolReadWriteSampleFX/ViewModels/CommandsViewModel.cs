//-----------------------------------------------------------------------
// <copyright file="CommandsViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// View model for reader commands
    /// </summary>
    public class CommandsViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for AlertDuration
        /// </summary>
        private AlertDuration alertDuration;

        /// <summary>
        /// Backing field for BuzzerTone
        /// </summary>
        private BuzzerTone buzzerTone;

        /// <summary>
        /// Backing field for IsBuzzerEnabled
        /// </summary>
        private bool isBuzzerEnabled;

        /// <summary>
        /// Backing field for IsEchoEnabled
        /// </summary>
        private bool isEchoEnabled;

        /// <summary>
        /// Backing field for IsVibrateEnabled
        /// </summary>
        private bool isVibrateEnabled;

        private ICommandService commander;

        private IMessageService messages;

        /// <summary>
        /// Initializes a new instance of the CommandsViewModel class
        /// </summary>
        public CommandsViewModel(ICommandService commander, IMessageService messages)
            : base()
        {
            if (commander == null)
            {
                throw new ArgumentNullException("commander");
            }

            if (messages == null)
            {
                throw new ArgumentNullException("messages");
            }

            this.commander = commander;
            this.messages = messages;

            this.AbortCommand = new ReaderCommand(this.ExecuteAbort, ReaderCommandCanExecute.WhenConnected);
            this.AlertApplyCommand = new ReaderCommand(this.ExecuteAlertApply, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.AlertCommand = new ReaderCommand(this.ExecuteAlert, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.AlertReadCommand = new ReaderCommand(this.ExecuteAlertRead, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.BatteryStatusCommand = new ReaderCommand(this.ExecuteBatteryStatus, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.EchoApplyCommand = new ReaderCommand(this.ExecuteEchoApply, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.EchoReadCommand = new ReaderCommand(this.ExecuteEchoRead, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.FactoryDefaultsCommand = new ReaderCommand(this.ExecuteFactoryDefaults, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.SleepCommand = new ReaderCommand(this.ExecuteSleep, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.VersionCommand = new ReaderCommand(this.ExecuteVersion, ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets or sets the alert duration of the alert. Parameter for alert commands
        /// </summary>
        public AlertDuration AlertDuration
        {
            get
            {
                return this.alertDuration;
            }

            set
            {
                if (this.alertDuration != value)
                {
                    this.alertDuration = value;
                    this.OnPropertyChanged("AlertDuration");
                }
            }
        }

        /// <summary>
        /// Gets or sets the buzzer tone of the alert. Parameter for alert commands
        /// </summary>
        public BuzzerTone BuzzerTone
        {
            get
            {
                return this.buzzerTone;
            }

            set
            {
                if (this.buzzerTone != value)
                {
                    this.buzzerTone = value;
                    this.OnPropertyChanged("BuzzerTone");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the buzzer is enabled. Parameter for alert commands
        /// </summary>
        public bool IsBuzzerEnabled
        {
            get
            {
                return this.isBuzzerEnabled;
            }

            set
            {
                if (this.isBuzzerEnabled != value)
                {
                    this.isBuzzerEnabled = value;
                    this.OnPropertyChanged("IsBuzzerEnabled");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the echo is enabled. Parameter for echo commands
        /// </summary>
        public bool IsEchoEnabled
        {
            get
            {
                return this.isEchoEnabled;
            }

            set
            {
                if (this.isEchoEnabled != value)
                {
                    this.isEchoEnabled = value;
                    this.OnPropertyChanged("IsEchoEnabled");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the vibrate is enabled. Parameter for alert comamnds
        /// </summary>
        public bool IsVibrateEnabled
        {
            get
            {
                return this.isVibrateEnabled;
            }

            set
            {
                if (this.isVibrateEnabled != value)
                {
                    this.isVibrateEnabled = value;
                    this.OnPropertyChanged("IsVibrateEnabled");
                }
            }
        }

        /// <summary>
        /// Gets the ICommand instance that will perform a reader abort command
        /// </summary>
        public ICommand AbortCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand to perform an alert
        /// </summary>
        public ICommand AlertCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will read the alert command settings
        /// </summary>
        public ICommand AlertReadCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will set the alert command
        /// </summary>
        public ICommand AlertApplyCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will read the battery charge status
        /// </summary>
        public ICommand BatteryStatusCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will update the echo setting
        /// </summary>
        public ICommand EchoApplyCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will read the echo setting
        /// </summary>
        public ICommand EchoReadCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will perform a reader factory defaults command
        /// </summary>
        public ICommand FactoryDefaultsCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will command the reader to sleep
        /// </summary>
        public ICommand SleepCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will read the reader version information
        /// </summary>
        public ICommand VersionCommand { get; private set; }

        /// <summary>
        /// Commands the reader to execute the Abort command
        /// </summary>
        /// <param name="parameter">PARAMAETER NOT USED</param>
        private void ExecuteAbort(object parameter)
        {
            AbortCommand abort;

            abort = new AbortCommand();

            // never execute abort as synchronous as it will be issued to abort a running synchronous command and
            // you cannot execute another synchronous command while one is already executing
            this.commander.Execute(abort, false);
        }

        /// <summary>
        /// Performs a command to read the current alert settings
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteAlertRead(object parameter)
        {
            AlertCommand alert;

            alert = new AlertCommand();
            alert.TakeNoAction = true;
            alert.ReadParameters = true;
            this.commander.Execute(alert, true);

            this.AlertDuration = alert.AlertDuration.Value;
            this.IsBuzzerEnabled = alert.BuzzerEnabled == TriState.Yes;
            this.BuzzerTone = alert.BuzzerTone.Value;
            this.IsVibrateEnabled = alert.VibrateEnabled == TriState.Yes;
        }

        /// <summary>
        /// Performs a command to update the alert parameters
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteAlertApply(object parameter)
        {
            AlertCommand alert;

            alert = new AlertCommand();
            alert.AlertDuration = this.AlertDuration;
            alert.BuzzerEnabled = this.IsBuzzerEnabled ? TriState.Yes : TriState.No;
            alert.BuzzerTone = this.BuzzerTone;
            alert.VibrateEnabled = this.IsVibrateEnabled ? TriState.Yes : TriState.No;
            alert.TakeNoAction = true;
            this.commander.Execute(alert, true);
        }

        /// <summary>
        /// Performs a command to action an alert
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteAlert(object parameter)
        {
            this.commander.Execute(new AlertCommand(), true);
        }

        /// <summary>
        /// Performs a command to read the battery and charge status
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteBatteryStatus(object parameter)
        {
            BatteryStatusCommand battery;
            string message;

            battery = new BatteryStatusCommand();

            // execut synchronously so the commands receives the response from the reader
            // and the battery properties are updated with the current values;
            this.commander.Execute(battery, true);

            message = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                "{0}% {1}",
                battery.BatteryLevel,
                battery.ChargeStatus);

            this.messages.IssueMessage(true, "Battery", message);
        }

        /// <summary>
        /// Commands the echo setting to the selected value
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteEchoApply(object parameter)
        {
            EchoCommand echo;

            echo = new EchoCommand();
            echo.EchoEnabled = this.IsEchoEnabled ? TriState.Yes : TriState.No;
            this.commander.Execute(echo, true);
        }

        /// <summary>
        /// Commands the reader to get the current echo setting
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteEchoRead(object parameter)
        {
            EchoCommand echo;
            echo = new EchoCommand();
            echo.ReadParameters = true;
            this.commander.Execute(echo, true);
            this.IsEchoEnabled = echo.EchoEnabled == TriState.Yes;
        }

        /// <summary>
        /// Commands the reader to execute the Factory Defaults command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteFactoryDefaults(object parameter)
        {
            FactoryDefaultsCommand factoryDefaults;

            factoryDefaults = new FactoryDefaultsCommand();
            this.commander.Execute(factoryDefaults, true);
        }

        /// <summary>
        /// Performs a sleep command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSleep(object parameter)
        {
            this.commander.Execute(new SleepCommand(), true);
        }

        /// <summary>
        /// Performs a version command to get information about the reader
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteVersion(object parameter)
        {
            VersionInformationCommand version;

            version = new VersionInformationCommand();
            this.commander.Execute(version, true);

            this.Display("Antenna Serial Number", version.AntennaSerialNumber);
            this.Display("ASCII Protocol", version.AsciiProtocol);
            this.Display("Bootloader Version", version.BootloaderVersion);
            this.Display("Firmware Version", version.FirmwareVersion);
            this.Display("Manufacturer", version.Manufacturer);
            this.Display("Radio Bootloader Version", version.RadioBootloaderVersion);
            this.Display("Radio Firmware Version", version.RadioFirmwareVersion);
            this.Display("Radio Serial Numbder", version.RadioSerialNumber);
            this.Display("Serial Number", version.SerialNumber);
        }

        /// <summary>
        /// Displays a version response value with a label and value
        /// </summary>
        /// <param name="label">Description of the value</param>
        /// <param name="value">The value to display</param>
        private void Display(string label, string value)
        {
            this.messages.IssueMessage(true, "Version", label + " " + value);
        }
    }
}
