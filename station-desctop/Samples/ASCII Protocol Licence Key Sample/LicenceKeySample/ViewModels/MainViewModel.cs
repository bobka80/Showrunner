//-----------------------------------------------------------------------
// <copyright file="MainViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;    
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    using Entities;
    using Services;
    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// ViewModel to perform an Inventory
    /// </summary>
    public class MainViewModel
        : TaskViewModelBase
    {
        /// <summary>
        /// Backing field for CanExecuteAuthorise
        /// </summary>
        private bool canExecuteAuthoriseReader;

        /// <summary>
        /// Backing field for CanExecuteBarcode
        /// </summary>
        private bool canExecuteBarcode;

        /// <summary>
        /// Backing field for CanExecuteDeauthorise
        /// </summary>
        private bool canExecuteDeauthoriseReader;

        /// <summary>
        /// Backing field for CanExecuteInventory
        /// </summary>
        private bool canExecuteInventory;

        /// <summary>
        /// Backing field for IsAuthorised
        /// </summary>
        private bool isAuthorised;

        /// <summary>
        /// Backing field for IsAuthorisedReadersOnlyEnabled
        /// </summary>
        private bool isAuthorisedReadersOnlyEnabled;

        /// <summary>
        /// Provides the interface to execute ASCII commands
        /// </summary>
        private Services.IReaderCommand commander;

        /// <summary>
        /// Gets or sets the settings for the authorisation
        /// </summary>
        private ISettings settings;

        /// <summary>
        /// Initializes a new instance of the MainViewModel class
        /// </summary>
        /// <param name="commander">Used to send commands to the reader</param>
        /// <param name="settings">The settings to use for authorisation</param>
        /// <param name="barcodeResponder">
        /// A BarcodeCommand instance in the AsciiCommander's responder chain that will receive asynchronous barcode scans
        /// </param>
        /// <param name="inventoryResponder">
        /// An InventoryCommand instance in the AsciiCommander's responder chain that will receive asynchronous transponder inventory
        /// </param>
        public MainViewModel(IReaderCommand commander, ISettings settings, BarcodeCommand barcodeResponder, InventoryCommand inventoryResponder)
        {
            if (commander == null)
            {
                throw new ArgumentNullException("commander");
            }

            if (settings == null)
            {
                throw new ArgumentNullException("settings");
            }

            // when the setting change re-evaluate the authorisation
            this.settings = settings;
            this.settings.PropertyChanged += (sender, e) => { this.VerifyAuthorisation(); };

            this.commander = commander;            
            this.commander.IsConnectedChanged += this.Reader_IsConnectedChanged;
            this.commander.IsExecutingCommandChanged += this.Reader_IsExecutingCommandChanged;
            
            barcodeResponder.BarcodeReceived += this.Reader_BarcodeReceived;
            inventoryResponder.TransponderReceived += this.Reader_TransponderReceived;
        }

        /// <summary>
        /// Raised to show a message on the user interface
        /// </summary>
        public event EventHandler<TextEventArgs> Message;               

        /// <summary>
        /// Gets a text representation of the authorisation status
        /// </summary>
        public string AuthorisedStatus
        {
            get
            {
                if (!this.commander.IsConnected)
                {
                    return "No reader connected";
                }
                else if (this.IsAuthorised)
                {
                    return "Authorised";
                }
                else
                {
                    return "Not Authorised";
                }
            }
        }

        /// <summary>
        /// Gets a value indicating whether <see cref="ExecuteAuthorise"/> can be executed
        /// </summary>
        public bool CanExecuteAuthoriseReader
        {
            get
            {
                return this.canExecuteAuthoriseReader;
            }

            private set
            {
                this.SetProperty(ref this.canExecuteAuthoriseReader, value, "CanExecuteAuthoriseReader");
            }
        }

        /// <summary>
        /// Gets a value indicating whether <see cref="ExecuteBarcode"/> can be executed
        /// </summary>
        public bool CanExecuteBarcode
        {
            get
            {
                return this.canExecuteBarcode;
            }

            private set
            {
                this.SetProperty(ref this.canExecuteBarcode, value, "CanExecuteBarcode");
            }
        }        

        /// <summary>
        /// Gets a value indicating whether <see cref="ExecuteDeauthorise"/> can be executed
        /// </summary>
        public bool CanExecuteDeauthoriseReader
        {
            get
            {
                return this.canExecuteDeauthoriseReader;
            }

            private set
            {
                this.SetProperty(ref this.canExecuteDeauthoriseReader, value, "CanExecuteDeauthoriseReader");
            }
        }

        /// <summary>
        /// Gets a value indicating whether <see cref="ExecuteInventory"/> can be executed
        /// </summary>
        public bool CanExecuteInventory
        {
            get
            {
                return this.canExecuteInventory;
            }

            private set
            {
                this.SetProperty(ref this.canExecuteInventory, value, "CanExecuteInventory");
            }
        }

        /// <summary>
        /// Gets a value indicating whether the connected reader is authorised for use with this application
        /// </summary>
        public bool IsAuthorised
        {
            get
            {
                return this.isAuthorised;
            }

            private set
            {
                if (this.SetProperty(ref this.isAuthorised, value, "IsAuthorised"))
                {
                    this.UpdateCanExecute();
                    this.OnPropertyChanged("AuthorisedStatus");                    
                }

                this.OnMessage("Reader is authorised: " + (this.isAuthorised ? "YES" : "NO"));
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether this reader will work with authorised readers only
        /// </summary>
        public bool IsAuthorisedReadersOnlyEnabled
        {
            get
            {
                return this.isAuthorisedReadersOnlyEnabled;
            }

            set
            {
                if (this.SetProperty(ref this.isAuthorisedReadersOnlyEnabled, value, "IsAuthorisedReadersOnlyEnabled"))
                {
                    this.UpdateCanExecute();
                }
            }
        }

        /// <summary>
        /// Gets a value indicating whether the application should operate with the reader either because the reader is authorised or authorisation is turned off
        /// </summary>
        private bool IsReaderAuthrisedOrAuthorisationOff
        {
            get
            {
                return !this.IsAuthorisedReadersOnlyEnabled || this.IsAuthorised;
            }
        }

        /// <summary>
        /// Identifies the connected reader and uses the identity to program an appropriate licence key
        /// </summary>
        public void ExecuteAuthoriseReader()
        {
            this.PerformTask(
                this.CanExecuteAuthoriseReader, 
                delegate
                {
                    VersionInformationCommand version;
                    string licence;
                    bool authorised;

                    version = new VersionInformationCommand();
                    this.commander.ExecuteAsciiCommand(version, true);

                    if (this.IsLicenceKeyCommandSupported(version))
                    {
                        LicenceKeyCommand licenceCommand;

                        licence = LicenceKey.Compute(version.SerialNumber, this.settings.CompanyName, this.settings.Secret);
                        licenceCommand = new LicenceKeyCommand() { DeleteKey = Deletion.Yes, LicenceKey = licence };
                        this.commander.ExecuteAsciiCommand(licenceCommand, true);
                        if (licenceCommand.Response.IsSuccessful)
                        {
                            this.OnMessage("Licence key programmed");
                            authorised = true;
                        }
                        else
                        {
                            this.OnMessage("Failed to program licence key");
                            this.OnMessage(licenceCommand.Response.Messages.First());
                            authorised = false;
                        }                        
                    }
                    else
                    {
                        this.OnMessage("LicenceKey command not supported in this firmware");
                        this.OnMessage(version.AsciiProtocol);
                        authorised = false;
                    }

                    this.IsAuthorised = authorised;
                });
        }

        /// <summary>
        /// Performs an barcode scan
        /// </summary>
        public void ExecuteBarcode()
        {
            if (this.IsReaderAuthrisedOrAuthorisationOff)
            {
                this.PerformTask(this.CanExecuteBarcode, delegate { this.commander.ExecuteAsciiCommand(new BarcodeCommand(), false); });
            }
            else
            {
                this.OnMessage("Reader is not authorised to perform a barcode scan");
            }            
        }

        /// <summary>
        /// Deletes the licence key from the connected reader
        /// </summary>
        public void ExecuteDeauthoriseReader()
        {
            this.PerformTask(
                this.CanExecuteDeauthoriseReader, 
                delegate 
                {
                    LicenceKeyCommand licenceCommand;

                    licenceCommand = new LicenceKeyCommand() { DeleteKey = Deletion.Yes };
                    this.commander.ExecuteAsciiCommand(licenceCommand, true);
                    if (licenceCommand.Response.IsSuccessful)
                    {
                        this.OnMessage("Licence key deleted");                        
                    }
                    else
                    {
                        this.OnMessage("Failed to delete licence key");
                        this.OnMessage(licenceCommand.Response.Messages.First());
                    }

                    this.IsAuthorised = false;
                });
        }

        /// <summary>
        /// Performs an inventory
        /// </summary>
        public void ExecuteInventory()
        {
            if (this.IsReaderAuthrisedOrAuthorisationOff)
            {
                this.PerformTask(this.CanExecuteInventory, delegate { this.commander.ExecuteAsciiCommand(new InventoryCommand(), false); });
            }
            else
            {
                this.OnMessage("Reader is not authorised to perform inventory");
            }
        }

        /// <summary>
        /// Check that the reader is authorised to operate with this hadware
        /// </summary>
        /// <remarks>
        /// This would normally be in the service but moved into the view model to provide diagnostic messages to the view
        /// </remarks>
        public void VerifyAuthorisation()
        {
            VersionInformationCommand version;
            LicenceKeyCommand licenceCommand;
            string expectedLicenceKey;

            this.PerformTask(
                true,
                delegate
                {
                    bool authorised;

                    if (this.commander.IsConnected)
                    {
                        version = new VersionInformationCommand();
                        this.commander.ExecuteAsciiCommand(version, true);

                        if (this.IsLicenceKeyCommandSupported(version))
                        {
                            expectedLicenceKey = LicenceKey.Compute(version.SerialNumber, this.settings.CompanyName, this.settings.Secret);
                            licenceCommand = new LicenceKeyCommand();
                            this.commander.ExecuteAsciiCommand(licenceCommand, true);

                            if (licenceCommand.Response.IsSuccessful)
                            {
                                this.OnMessage("Expected Licence: " + expectedLicenceKey);
                                this.OnMessage("Reader Licence: " + licenceCommand.LicenceKey);
                                authorised = LicenceKey.Verify(
                                    version.SerialNumber,
                                    this.settings.CompanyName,
                                    this.settings.Secret,
                                    licenceCommand.LicenceKey);
                            }
                            else
                            {
                                this.OnMessage("Failed to program licence key");
                                this.OnMessage(licenceCommand.Response.Messages.First());
                                authorised = false;
                            }
                        }
                        else
                        {
                            this.OnMessage("LicenceKey command not supported in this firmware");
                            this.OnMessage(version.AsciiProtocol);
                            authorised = false;
                        }
                    }
                    else
                    {
                        authorised = false;
                    }

                    this.IsAuthorised = authorised;
                });
        }

        /// <summary>
        /// Capture changes to IsBusy and IsConnected to notify when derived properties change
        /// </summary>
        /// <param name="propertyName">The name of the property that changed value</param>
        protected override void OnPropertyChanged(string propertyName)
        {
            base.OnPropertyChanged(propertyName);

            switch (propertyName)
            {
                case "ErrorMessage":

                    // Append any error message into the message list
                    if (!string.IsNullOrEmpty(this.ErrorMessage))
                    {
                        this.OnMessage("ERROR");
                        this.OnMessage(this.ErrorMessage);
                    }

                    break;

                case "IsBusy":
                    this.UpdateCanExecute();
                    break;
            }
        }

        /// <summary>
        /// Raises the Message event on the UI thread
        /// </summary>
        /// <param name="message">The message to notify the UI with</param>
        protected virtual void OnMessage(string message)
        {
            EventHandler<TextEventArgs> handler;

            handler = this.Message;
            if (handler != null)
            {
                Dispatcher.InvokeIfRequired(() => { handler(this, new TextEventArgs(message)); });
            }
        }

        /// <summary>
        /// Relays the barcode scan event to the view
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Reader_BarcodeReceived(object sender, BarcodeEventArgs e)
        {
            if (this.IsReaderAuthrisedOrAuthorisationOff)
            {
                this.OnMessage(e.Barcode);
            }
        }

        /// <summary>
        /// Updates the user interface and verifies authorisation when the connected state of the reader changes
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Reader_IsConnectedChanged(object sender, EventArgs e)
        {
            Dispatcher.InvokeIfRequired(this.UpdateCanExecute);

            System.Threading.ThreadPool.QueueUserWorkItem((state) => { this.VerifyAuthorisation(); });
        }

        /// <summary>
        /// Updates the user interface while performing a reader operation
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Reader_IsExecutingCommandChanged(object sender, EventArgs e)
        {
            Dispatcher.InvokeIfRequired(this.UpdateCanExecute);
        }

        /// <summary>
        /// Relays the transponder found event to the view
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Reader_TransponderReceived(object sender, TransponderDataEventArgs e)
        {
            if (this.IsReaderAuthrisedOrAuthorisationOff)
            {
                this.OnMessage(e.Transponder.ToString());
            }
        }

        /// <summary>
        /// Updates the various commands based on the current status
        /// </summary>
        private void UpdateCanExecute()
        {
            bool canExecute;

            canExecute = !this.IsBusy && this.commander.IsConnected && !this.commander.IsExecutingCommand;
            this.CanExecuteAuthoriseReader = canExecute;
            this.CanExecuteBarcode = canExecute && this.IsReaderAuthrisedOrAuthorisationOff; // demonstrate we can disable commands based on auth
            this.CanExecuteDeauthoriseReader = canExecute; // leave enabled to message commmand disabled
            this.CanExecuteInventory = canExecute;
        }

        /// <summary>
        /// Returns a value indicating whether the reader ASCII Protocol Version supports the licence key command
        /// </summary>
        /// <param name="version">The version information response from the reader</param>
        /// <returns>True if the ASCII Protocol version is 2.2 or higher</returns>
        private bool IsLicenceKeyCommandSupported(VersionInformationCommand version)
        {
            return new Version(version.AsciiProtocol) >= new Version(2, 2);
        }
    }
}