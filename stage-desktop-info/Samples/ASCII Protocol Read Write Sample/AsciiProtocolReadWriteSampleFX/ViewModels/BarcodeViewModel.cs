//-----------------------------------------------------------------------
// <copyright file="BarcodeViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    /// View model for barcode commands
    /// </summary>
    public class BarcodeViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The barcode command that gets executed
        /// </summary>
        private BarcodeCommand barcodeCommand;

        /// <summary>
        /// Commands the connected reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// Reports messages to the user interface
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Collects unique identifiers
        /// </summary>
        private IIdentifierCache identifierCache;

        /// <summary>
        /// Initializes a new instance of the BarcodeViewModel class
        /// </summary>
        public BarcodeViewModel(ICommandService commander, IMessageService messages, IIdentifierCache identifierCache)
        {
            if (commander == null)
            {
                throw new ArgumentNullException("commander");
            }

            if (messages == null)
            {
                throw new ArgumentNullException("messages");
            }

            if (identifierCache == null)
            {
                throw new ArgumentNullException("identifierCache");
            }

            this.commander = commander;
            this.messages = messages;
            this.identifierCache = identifierCache;

            this.barcodeCommand = new BarcodeCommand();
            this.barcodeCommand.BarcodeReceived += this.SynchronousBarcode_Received;

            this.BarcodeAsynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteBarcodeCommand(false); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.BarcodeSynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteBarcodeCommand(true); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets or sets the timeout in seconds of the Barcode command
        /// </summary>
        public int Timeout
        {
            get
            {
                // TODO: this is a bug. Until timeout is assigned reader uses its default which is not 3
                return this.barcodeCommand.ScanTime ?? 3;
            }

            set
            {
                if ((value < 1) || (value > 9))
                {
                    throw new ArgumentOutOfRangeException("value");
                }

                if ((!this.barcodeCommand.ScanTime.HasValue) || (this.barcodeCommand.ScanTime.Value != value))
                {
                    this.barcodeCommand.ScanTime = value;
                    this.OnPropertyChanged("Timeout");
                }
            }
        }

        /// <summary>
        /// Gets the barcode command that executes asynchronously
        /// </summary>
        public ICommand BarcodeAsynchronous { get; private set; }

        /// <summary>
        /// Gets the barcode command that executes synchronously
        /// </summary>
        public ICommand BarcodeSynchronous { get; private set; }

        /// <summary>
        /// Performs the command to read a barcode
        /// </summary>
        /// <param name="isCommandSynchronous">
        /// True to perform the command synchronously
        /// False to perform the command asynchronously
        /// </param>
        private void ExecuteBarcodeCommand(bool isCommandSynchronous)
        {
            this.commander.Execute(this.barcodeCommand, isCommandSynchronous);
        }

        /// <summary>
        /// Displays the barcode when it is received synchronously from the synchronous responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousBarcode_Received(object sender, BarcodeEventArgs e)
        {
            this.messages.DisplayMessage(true, e);
            this.identifierCache.AddBarcode(e);
        }
    }
}
