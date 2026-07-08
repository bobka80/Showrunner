//-----------------------------------------------------------------------
// <copyright file="ConfigureReaderViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    public class ConfigureReaderViewModel
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

        /// <summary>
        /// Backing field for SleepTimeout
        /// </summary>
        private int sleepTimeout = 30;

        /// <summary>
        /// Backing field for Bluetooth friendly name
        /// </summary>
        private string bluetoothFriendlyName = string.Empty;

        /// <summary>
        /// Backing field for BluetoothBundleIdentifier
        /// </summary>
        private string bluetoothBundleIdentifier = string.Empty;

        /// <summary>
        /// Backing field for BluetoothBundleSeed
        /// </summary>
        private string bluetoothBundleSeed = string.Empty;

        /// <summary>
        /// Backing field for Bluetooth PIN
        /// </summary>
        private string bluetoothPin = string.Empty;

        /// <summary>
        /// To execute ASCII commands on the reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// To report messages to the user interface
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Initializes a new instance of the ConfigureReaderViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        public ConfigureReaderViewModel(ICommandService commander, IMessageService messages)
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

            this.AlertApplyCommand = new ReaderCommand(this.ExecuteAlertApply, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.AlertReadCommand = new ReaderCommand(this.ExecuteAlertRead, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.EchoApplyCommand = new ReaderCommand(this.ExecuteEchoApply, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.EchoReadCommand = new ReaderCommand(this.ExecuteEchoRead, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.FactoryDefaultsCommand = new ReaderCommand(this.ExecuteFactoryDefaults, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.ReadDateTimeCommand = new ReaderCommand(this.ExecuteReadDateTime, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.WriteDateTimeCommand = new ReaderCommand(this.ExecuteWriteDateTime, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.ReadSleepTimeoutCommand = new ReaderCommand(this.ExecuteReadSleepTimeout, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.WriteSleepTimeoutCommand = new ReaderCommand(this.ExecuteWriteSleepTimeout, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.ReadBluetoothCommand = new ReaderCommand(this.ExecuteReadBluetooth, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.WriteBluetoothCommand = new ReaderCommand(this.ExecuteWriteBluetooth, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ResetBluetoothCommand = new ReaderCommand(this.ExecuteResetBluetooth, ReaderCommandCanExecute.WhenConnectedAndIdle);
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
        /// Gets the available alert duractions
        /// </summary>
        public ICollection<AlertDuration> AlertDurations
        {
            get
            {
                return (AlertDuration[])Enum.GetValues(typeof(AlertDuration));
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
        /// Gets the available buzzer tones
        /// </summary>
        public ICollection<BuzzerTone> BuzzerTones
        {
            get
            {
                return (BuzzerTone[])Enum.GetValues(typeof(BuzzerTone));
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
        /// Gets or sets the idle timeout before the reader sleeps if there is no connection to the reader
        /// </summary>
        public int SleepTimeout
        {
            get
            {
                return this.sleepTimeout;
            }

            set
            {
                if (this.sleepTimeout != value)
                {
                    this.sleepTimeout = value;
                    this.OnPropertyChanged("SleepTimeout");
                }
            }
        }

        /// <summary>
        /// Gets or sets the Bluetooth friendly name read or to apply with the Bluetooth commands
        /// </summary>
        public string BluetoothFriendlyName
        {
            get
            {
                return this.bluetoothFriendlyName;
            }

            set
            {
                if (this.bluetoothFriendlyName != value)
                {
                    this.bluetoothFriendlyName = value;
                    this.OnPropertyChanged("BluetoothFriendlyName");
                }
            }
        }        

        /// <summary>
        /// Gets or sets the BundleIdentifier to write to the Bluetooth module
        /// </summary>
        public string BluetoothBundleIdentifier
        {
            get
            {
                return this.bluetoothBundleIdentifier;
            }

            set
            {
                if (this.bluetoothBundleIdentifier != value)
                {
                    this.bluetoothBundleIdentifier = value;
                    this.OnPropertyChanged("BluetoothBundleIdentifier");
                }
            }
        }

        /// <summary>
        /// Gets or sets the BundleSeed to write to the Bluetooth module
        /// </summary>
        public string BluetoothBundleSeed
        {
            get
            {
                return this.bluetoothBundleSeed;
            }

            set
            {
                if (this.bluetoothBundleSeed != value)
                {
                    this.bluetoothBundleSeed = value;
                    this.OnPropertyChanged("BluetoothBundleSeed");
                }
            }
        }

        /// <summary>
        /// Gets or sets the Bluetooth PIN read or to apply with the Bluetooth commands
        /// </summary>
        public string BluetoothPin
        {
            get
            {
                return this.bluetoothPin;
            }

            set
            {
                if (this.bluetoothPin != value)
                {
                    this.bluetoothPin = value;
                    this.OnPropertyChanged("BluetoothPin");
                }
            }
        }

        /// <summary>
        /// Gets the ICommand instance that will read the alert command settings
        /// </summary>
        public ICommand AlertReadCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will set the alert command
        /// </summary>
        public ICommand AlertApplyCommand { get; private set; }

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
        /// Gets the ICommand instance that will read the current date and time from the reader
        /// </summary>
        public ICommand ReadDateTimeCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will write the current date and time to the reader
        /// </summary>
        public ICommand WriteDateTimeCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will read the current sleep timeout setting
        /// </summary>
        public ICommand ReadSleepTimeoutCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will write the sleep timeout setting to the value specified
        /// </summary>
        public ICommand WriteSleepTimeoutCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will read the current Bluetooth settings
        /// </summary>
        public ICommand ReadBluetoothCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will update the current Bluetooth
        /// </summary>
        public ICommand WriteBluetoothCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will reset the current Bluetooth settings
        /// </summary>
        public ICommand ResetBluetoothCommand { get; private set; }

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
        /// Reads the current date and time from the reader
        /// </summary>
        /// <param name="parmeter">Parameter not used</param>
        private void ExecuteReadDateTime(object parmeter)
        {
            try         
            {
                DateCommand dateCommand;
                TimeCommand timeCommand;

                dateCommand = new DateCommand();
                this.commander.Execute(dateCommand, true);
                this.messages.IssueMessage(true, "DateTime", dateCommand.Date.Value.ToShortDateString());

                timeCommand = new TimeCommand();
                this.commander.Execute(timeCommand, true);
                this.messages.IssueMessage(true, "DateTime", timeCommand.Time.Value.ToShortTimeString());
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Writes the current date and time to the reader
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteWriteDateTime(object parameter)
        {
            try
            {
                DateTime value;
                DateCommand dateCommand;
                TimeCommand timeCommand;

                value = DateTime.Now;

                dateCommand = new DateCommand();
                dateCommand.Date = value;
                this.commander.Execute(dateCommand, true);
                this.messages.IssueMessage(true, "DateTime", dateCommand.Date.Value.ToShortDateString());

                timeCommand = new TimeCommand();
                timeCommand.Time = value;
                this.commander.Execute(timeCommand, true);
                this.messages.IssueMessage(true, "DateTime", timeCommand.Time.Value.ToShortTimeString());
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Reads the sleep timeout setting from the reader
        /// </summary>
        /// <param name="parmeter">Parameter not used</param>
        private void ExecuteReadSleepTimeout(object parmeter)
        {
            try
            {
                SleepTimeoutCommand command;

                command = new SleepTimeoutCommand();
                command.ReadParameters = true;
                this.commander.Execute(command, true);
                this.messages.IssueMessage(true, "Sleep Timeout", command.SleepTimeout);
                this.SleepTimeout = command.SleepTimeout.Value;
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Updates the sleep timeout setting to the reader
        /// </summary>
        /// <param name="parmeter">Parameter not used</param>
        private void ExecuteWriteSleepTimeout(object parmeter)
        {
            try
            {
                SleepTimeoutCommand command;

                command = new SleepTimeoutCommand();
                command.SleepTimeout = this.SleepTimeout;
                this.commander.Execute(command, true);
                this.messages.IssueMessage(true, "Sleep Timeout", command.SleepTimeout);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Reads the parameters from the Bluetooth of the device
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteReadBluetooth(object parameter)
        {            
            try
            {
                BluetoothCommand command;

                command = new BluetoothCommand();
                command.ReadParameters = true;
                
                if (this.ExecuteBluetooth(command))
                {
                    this.BluetoothFriendlyName = command.BluetoothFriendlyName;
                    this.BluetoothPin = command.PairingCode;
                    this.Display("Authentication Chip:", command.AuthenticationChip.ToString());
                    this.Display("Bluetooth Address:", command.BluetoothAddress);
                    this.Display("Bluetooth Friendly Name:", command.BluetoothFriendlyName);
                    this.Display("Read", "Success");
                }
                else
                {
                    this.Display("Read", "Failed");
                }
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Resets the parameters of the Bluetooth of the device to defaults
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteResetBluetooth(object parameter)
        {
            try
            {
                BluetoothCommand command;

                command = new BluetoothCommand();
                command.ResetParameters = true;
                command.ReadParameters = true;

                if (this.ExecuteBluetooth(command))
                {
                    this.BluetoothFriendlyName = command.BluetoothFriendlyName;
                    this.BluetoothPin = command.PairingCode;
                    this.Display("Authentication Chip:", command.AuthenticationChip.ToString());
                    this.Display("Bluetooth Address:", command.BluetoothAddress);
                    this.Display("Bluetooth Friendly Name:", command.BluetoothFriendlyName);
                    this.Display("Reset", "Success");
                }
                else
                {
                    this.Display("Reset", "Failed");
                }
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Updates the parameters from the Bluetooth of the device
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteWriteBluetooth(object parameter)
        {
            try
            {
                BluetoothCommand command;

                command = new BluetoothCommand();
                command.BluetoothFriendlyName = this.BluetoothFriendlyName;
                command.BundleIdentifier = this.BluetoothBundleIdentifier;
                command.BundleSeed = this.BluetoothBundleSeed;
                command.PairingCode = this.BluetoothPin;                

                if (this.ExecuteBluetooth(command))
                {
                    this.Display("Authentication Chip:", command.AuthenticationChip.ToString());
                    this.Display("Bluetooth Address:", command.BluetoothAddress);
                    this.Display("Bluetooth Friendly Name:", command.BluetoothFriendlyName);                    
                    this.Display("Write", "Success");
                }
                else
                {
                    this.Display("Reset", "Failed");
                }
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Displays a version response value with a label and value
        /// </summary>
        /// <param name="label">Description of the value</param>
        /// <param name="value">The value to display</param>
        private void Display(string label, string value)
        {
            this.messages.IssueMessage(true, "Bluetooth", label + " " + value);
        }

        /// <summary>
        /// Performs the bluetooth command and times the execution
        /// </summary>
        /// <param name="command">The BluetoothCommand to execute synchronously</param>
        /// <returns>True if the commands is successful, false otherwise</returns>
        private bool ExecuteBluetooth(BluetoothCommand command)
        {
            DateTime startTime;
            DateTime endTime;

            startTime = DateTime.Now;
            this.commander.Execute(command, true);
            endTime = DateTime.Now;

            if ((command as AsciiCommandBase).Response.IsSuccessful)
            {
                string message;

                message = string.Format("Completed in {0:0.0}s", endTime.Subtract(startTime).TotalSeconds);
                this.messages.IssueMessage(true, "Bluetooth", message);
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}
