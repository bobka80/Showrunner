//-----------------------------------------------------------------------
// <copyright file="MainViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// View model for main form
    /// </summary>
    public class MainViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Responder to capture lines that are asynchronous swithc responses and display them to the screen
        /// </summary>
        private SwitchAsynchronousResponder switchResponder;

        /// <summary>
        /// Backing field for <see cref="QuerySession"/>
        /// </summary>
        private QuerySession querySession;

        /// <summary>
        /// Backing field for <see cref="QueryTarget"/>
        /// </summary>
        private QueryTarget queryTarget;

        /// <summary>
        /// Initializes a new instance of the MainViewModel class
        /// </summary>
        public MainViewModel()
            : base()
        {
            InventoryCommand inventoryCommand;
            BarcodeCommand barcodeCommand;

            // Create a display responder to capture and display all reader responses            
            Service.DisplayResponder.ReceivedLine += delegate(object sender, AsciiLineEventArgs e)
            {
                this.OnResponseLine(e.Line.FullLine);
            };

            // Create a switch responder to capture asynchronous switch responses
            this.switchResponder = new SwitchAsynchronousResponder();
            this.switchResponder.SwitchStateChanged += delegate(object sender, SwitchStateEventArgs e)
            {
                this.IssueMessage(false, "Switch", e.State);
            };

            // setup an asynchronous responder for inventory
            inventoryCommand = new InventoryCommand();
            inventoryCommand.IsIndexedCommand = false;
            inventoryCommand.IsLibraryCommand = false;
            inventoryCommand.TransponderReceived += this.AsynchronousTransponder_Received;

            // setup an asynchronous responder for barcodes
            barcodeCommand = new BarcodeCommand();
            barcodeCommand.IsIndexedCommand = false;
            barcodeCommand.IsLibraryCommand = false;
            barcodeCommand.BarcodeReceived += this.AsynchronousBarcode_Received;

            // set up the responder chain
            Service.Reader.ClearResponders();
            Service.Reader.AddResponder(new LoggerResponder());
            Service.Reader.AddResponder(Service.DisplayResponder);
            Service.Reader.AddResponder(this.switchResponder);
            Service.Reader.AddSynchronousResponder();
            Service.Reader.AddResponder(inventoryCommand.Responder);
            Service.Reader.AddResponder(barcodeCommand.Responder);

            this.BarcodeAsynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteBarcodeCommand(false); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.BarcodeSynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteBarcodeCommand(true); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.InventoryAsynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteInventoryCommand(false); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.InventorySynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteInventoryCommand(true); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.ReadSwitchState = new ReaderCommand(
                delegate(object state) { this.ExecuteReadSwitchState(); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Raised to indicate messages to the user interface
        /// </summary>
        public event EventHandler<TextEventArgs> Message;

        /// <summary>
        /// Raised for each line of a response received
        /// </summary>
        public event EventHandler<TextEventArgs> ResponseLine;       

        /// <summary>
        /// Gets the barcode command that executes asynchronously
        /// </summary>
        public ICommand BarcodeAsynchronous { get; private set; }

        /// <summary>
        /// Gets the barcode command that executes synchronously
        /// </summary>
        public ICommand BarcodeSynchronous { get; private set; }

        /// <summary>
        /// Gets the inventory command that executes synchronously
        /// </summary>
        public ICommand InventoryAsynchronous { get; private set; }

        /// <summary>
        /// Gets the inventory command that executes asynchronously
        /// </summary>
        public ICommand InventorySynchronous { get; private set; }

        /// <summary>
        /// Gets the command to read the current switch state
        /// </summary>
        public ICommand ReadSwitchState { get; private set; }

        /// <summary>
        /// Gets or sets the <see cref="QuerySession"/> used for the inventory commands
        /// </summary>
        public QuerySession Session 
        {
            get
            {
                return this.querySession;
            }

            set
            {
                if (this.querySession != value)
                {
                    this.querySession = value;
                    this.OnPropertyChanged("QuerySession");
                }
            }
        }

        /// <summary>
        /// Gets or sets the <see cref="QueryTarget"/> used for the inventory commands
        /// </summary>
        public QueryTarget Target 
        {
            get
            {
                return this.queryTarget;
            }
            
            set
            {
                if (this.queryTarget != value)
                {
                    this.queryTarget = value;
                    this.OnPropertyChanged("Target");
                }
            }
        }

        /// <summary>
        /// Raises the <see cref="TransponderMessageHandler"/> event
        /// </summary>
        /// <param name="value">The message to display</param>
        protected virtual void OnMessage(string value)
        {
            EventHandler<TextEventArgs> handler;

            handler = this.Message;
            if (handler != null)
            {
                handler(this, new TextEventArgs(value));
            }
        }

        /// <summary>
        /// Raises the <see cref="ResponseLine"/> event
        /// </summary>
        /// <param name="value">The line to display</param>
        protected virtual void OnResponseLine(string value)
        {
            EventHandler<TextEventArgs> handler;

            handler = this.ResponseLine;
            if (handler != null)
            {
                handler(this, new TextEventArgs(value));
            }
        }

        /// <summary>
        /// Execute the Inventory command
        /// </summary>
        /// <param name="isCommandSynchronous">
        /// True to perform the command synchronously.
        /// False to perform the command asynchronously.
        /// </param>
        private void ExecuteInventoryCommand(bool isCommandSynchronous)
        {
            IAsciiCommandSynchronousResponder synchronousResponder = null;

            try
            {
                // Create a new Inventory command
                InventoryCommand inventory = new InventoryCommand();
                inventory.QuerySession = this.Session;
                inventory.QueryTarget = this.Target;

                if (inventory != null)
                {
                    synchronousResponder = isCommandSynchronous ? inventory.Responder : null;
                    inventory.TransponderReceived += this.SynchronousTransponder_Received;
                }

                try
                {
                    Service.Reader.ExecuteCommand(inventory, synchronousResponder);
                }
                finally
                {
                    if (inventory != null)
                    {
                        inventory.TransponderReceived -= this.SynchronousTransponder_Received;
                    }
                }
            }
            catch (Exception ex)
            {
                this.OnMessage(ex.Message);
            }
        }

        /// <summary>
        /// Execute the Barcode command
        /// </summary>
        /// <param name="isCommandSynchronous">
        /// True to perform the command synchronously.
        /// False to perform the command asynchronously.
        /// </param>
        private void ExecuteBarcodeCommand(bool isCommandSynchronous)
        {
            IAsciiCommandSynchronousResponder synchronousResponder = null;

            try
            {
                // Create a new Inventory command
                BarcodeCommand barcodeCommand = new BarcodeCommand();

                if (barcodeCommand != null)
                {
                    synchronousResponder = isCommandSynchronous ? barcodeCommand.Responder : null;
                    barcodeCommand.BarcodeReceived += this.SynchronousBarcode_Received;
                }

                try
                {
                    Service.Reader.ExecuteCommand(barcodeCommand, synchronousResponder);
                }
                finally
                {
                    if (barcodeCommand != null)
                    {
                        barcodeCommand.BarcodeReceived -= this.SynchronousBarcode_Received;
                    }
                }

                // Report the error messages for unsuccessful synchronous commands
                if (isCommandSynchronous && !barcodeCommand.Response.IsSuccessful)
                {
                    foreach (string message in barcodeCommand.Response.Messages)
                    {
                        this.IssueMessage(true, "Barcode", message);
                    }
                }
            }
            catch (Exception ex)
            {
                this.IssueMessage(true, "ERROR", ex.Message);
            }
        }

        /// <summary>
        /// Execute the command to read the switch state
        /// </summary>
        private void ExecuteReadSwitchState()
        {
            try
            {
                SwitchStateCommand command;

                command = new SwitchStateCommand();
                Service.Reader.ExecuteCommand(command, command.Responder);
                this.IssueMessage(true, "Switch", command.State);
            }
            catch (Exception ex)
            {
                this.IssueMessage(true, "ERROR", ex.Message);
            }
        }

        /// <summary>
        /// Displays the transponder when a transponder is received asynchronously from
        /// the responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void AsynchronousTransponder_Received(object sender, TransponderDataEventArgs e)
        {
            this.IssueMessage(false, "Transponder", e.Transponder.Epc);
        }

        /// <summary>
        /// Displays the transponder when a transponder is received synchronously from the
        /// synchronous responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousTransponder_Received(object sender, TransponderDataEventArgs e)
        {
            this.IssueMessage(true, "Transponder", e.Transponder.Epc);
        }

        /// <summary>
        /// Displays the barcode when it is received asynchronously from the responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void AsynchronousBarcode_Received(object sender, BarcodeEventArgs e)
        {
            this.IssueMessage(false, "Barcode", e.Barcode);
        }

        /// <summary>
        /// Displays the barcode when it is received synchronously from the synchronous responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousBarcode_Received(object sender, BarcodeEventArgs e)
        {
            this.IssueMessage(true, "Barcode", e.Barcode);
        }

        /// <summary>
        /// Displays the message to the user interface through an event
        /// </summary>
        /// <param name="synchronous">True if the source was synchronous, false if it was asynchronous</param>
        /// <param name="source">The type of event e.g. "Barcode, "Switch", "Transponder"</param>
        /// <param name="message">The message to display</param>
        /// TODO: this should be a databound observable list?
        private void IssueMessage(bool synchronous, string source, object message)
        {
            string text;

            text = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                "{0,-8} {1:-15} {2}",
                synchronous ? "[ Sync]" : "[Async]",
                source,
                message);

            this.OnMessage(text);
        }
    }
}
