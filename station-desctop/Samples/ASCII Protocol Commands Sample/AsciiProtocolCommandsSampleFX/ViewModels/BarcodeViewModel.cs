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
        /// To execute ASCII commands on the reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// Initializes a new instance of the BarcodeViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        public BarcodeViewModel(ICommandService commander)
        {
            if (commander == null)
            {
                throw new ArgumentNullException("commander");
            }

            this.commander = commander;

            this.barcodeCommand = new BarcodeCommand();

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
    }
}
