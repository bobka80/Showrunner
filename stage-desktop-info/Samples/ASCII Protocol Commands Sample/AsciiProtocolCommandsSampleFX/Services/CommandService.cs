//-----------------------------------------------------------------------
// <copyright file="CommandService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Entities;
    using Services;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// Extends the reader service to setup the responder chain for the application and relays responses to the <see cref="MessageService"/>
    /// </summary>
    public class CommandService
        : ReaderService
    {
        /// <summary>
        /// True once this instance is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// Identifier cache to record transponders to
        /// </summary>
        private IIdentifierCache identifierCache;

        /// <summary>
        /// Builds a history of unique transponders seen
        /// </summary>
        private Entities.InventoryCache inventoryCache;

        /// <summary>
        /// Initializes a new instance of the CommandService class
        /// </summary>
        /// <param name="messageService">message service to report to</param>
        /// <param name="identifierCache">cache to report 'seen' transponders and barcode to</param>
        /// <param name="fileDownloadResponder">Reports the progress of a file download</param>
        /// <param name="displayResponder">Resports aynchronsous responses from the reader</param>
        /// <param name="inventoryCache">Build a history of unique identifiers seen</param>
        public CommandService(
            IMessageService messageService, 
            IIdentifierCache identifierCache,
            FileDownloadResponder fileDownloadResponder,
            DisplayResponder displayResponder,
            Entities.InventoryCache inventoryCache)
            : base(messageService)
        {
            BarcodeCommand barcodeCommand;
            InventoryCommand inventoryCommand;
            SwitchAsynchronousResponder switchResponder;

            if (identifierCache == null)
            {
                throw new ArgumentNullException("identifierCache");
            }

            this.identifierCache = identifierCache;
            this.inventoryCache = inventoryCache;

            // setup an asynchronous responder for barcodes
            barcodeCommand = new BarcodeCommand();
            barcodeCommand.BarcodeReceived += this.AsynchronousBarcode_Received;

            // setup an asynchronous responder for inventory
            inventoryCommand = new InventoryCommand();
            ////inventoryCommand.TransponderReceived += this.AsynchronousTransponder_Received;
            inventoryCommand.Response.CommandComplete += delegate(object sender, EventArgs e)
            {
                this.inventoryCache
                    .AddTransponders(inventoryCommand.Transponders.Select(x => x.ToIdentifiedItem()));
            };

            // Create a switch responder to capture asynchronous switch responses
            switchResponder = new SwitchAsynchronousResponder();
            switchResponder.SwitchStateChanged += this.AsynchronousSwitchState_Received;

            // set up the responder chain
            this.Commander.ClearResponders();
            this.Commander.AddResponder(fileDownloadResponder);
            this.Commander.AddResponder(new LoggerResponder());
            this.Commander.AddResponder(displayResponder);
            this.Commander.AddResponder(switchResponder);
            this.Commander.AddSynchronousResponder();
            this.Commander.AddResponder(inventoryCommand.Responder);
            this.Commander.AddResponder(barcodeCommand.Responder);
        }

        /// <summary>
        /// Execute the ASCII command
        /// </summary>
        /// <param name="command">The command to execute</param>
        /// <param name="synchronousResponder">
        /// The responder to call to execute command as a synchronous command or null (Nothing in Visual Basic) to execute the command asynchronously
        /// </param>
        /// <remarks>
        /// Synchronous commands will block until the command is complete. Asynchronous commands will return once the command has been sent to the reader
        /// </remarks>
        public override void ExecuteCommand(IAsciiCommand command, IAsciiCommandSynchronousResponder synchronousResponder)
        {
            TranspondersCommandBase transponders = null;
            BarcodeCommand barcode = null;
            EventHandler commandComplete = null;

            if (synchronousResponder != null)
            {
                barcode = command as BarcodeCommand;
                if (barcode != null)
                {
                    barcode.BarcodeReceived += this.SynchronousBarcode_Received;
                }
                else
                {
                    transponders = command as TranspondersCommandBase;
                    if (transponders != null)
                    {
                        commandComplete = delegate(object sender, EventArgs e)
                        {
                            this.inventoryCache
                                .AddTransponders(transponders.Transponders.Select(x => x.ToIdentifiedItem()));
                        };

                        ////transponders.TransponderReceived += this.SynchronousTransponder_Received;
                        transponders.Response.CommandComplete += commandComplete;
                    }
                }
            }

            try
            {
                base.ExecuteCommand(command, synchronousResponder);
            }
            finally
            {
                if (transponders != null)
                {
                    ////transponders.TransponderReceived -= this.SynchronousTransponder_Received;
                    transponders.Response.CommandComplete -= commandComplete;
                }

                if (barcode != null)
                {
                    barcode.BarcodeReceived -= this.SynchronousBarcode_Received;
                }
            }
        }

        /// <summary>
        /// Disposes an instance of the CommandService class
        /// </summary>
        /// <param name="disposing">True to dispose managed as well as unmanaged resources</param>
        protected override void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                }

                this.disposed = true;
            }

            base.Dispose(disposing);
        }

        /// <summary>
        /// Displays the switch state when changes in switch state are received asynchronously
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void AsynchronousSwitchState_Received(object sender, SwitchStateEventArgs e)
        {
            this.Messages.DisplayMessage(false, e.State);
        }

        /// <summary>
        /// Displays the transponder when a transponder is received asynchronously from
        /// the responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void AsynchronousTransponder_Received(object sender, TransponderDataEventArgs e)
        {
            this.Messages.DisplayMessage(false, e.Transponder);
            this.identifierCache.AddTransponder(e.Transponder);
        }

        /// <summary>
        /// Displays the barcode when it is received asynchronously from the responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void AsynchronousBarcode_Received(object sender, BarcodeEventArgs e)
        {
            this.Messages.DisplayMessage(false, e);
            this.identifierCache.AddBarcode(e);
        }

        /// <summary>
        /// Displays the transponder when a transponder is received synchronously from
        /// the executing command
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousTransponder_Received(object sender, TransponderDataEventArgs e)
        {
            this.Messages.DisplayMessage(true, e.Transponder);
            this.identifierCache.AddTransponder(e.Transponder);
        }

        /// <summary>
        /// Displays the barcode when it is received synchronously from the executing command
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousBarcode_Received(object sender, BarcodeEventArgs e)
        {
            this.Messages.DisplayMessage(true, e);
            this.identifierCache.AddBarcode(e);
        }
    }
}
