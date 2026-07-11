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
        /// True when an instance of this class is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// Identifier cache to record transponders to
        /// </summary>
        private IIdentifierCache identifierCache;

        /// <summary>
        /// Initializes a new instance of the CommandService class
        /// </summary>
        /// <param name="messageService">message service to report to</param>
        /// <param name="identifierCache">cache to report 'seen' transponders and barcode to</param>
        public CommandService(
            IMessageService messageService, 
            IIdentifierCache identifierCache, 
            FileDownloadResponder fileDownloadResponder,
            DisplayResponder displayResponder)
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

            // setup an asynchronous responder for barcodes
            barcodeCommand = new BarcodeCommand();
            barcodeCommand.BarcodeReceived += this.AsynchronousBarcode_Received;

            // setup an asynchronous responder for inventory
            inventoryCommand = new InventoryCommand();
            inventoryCommand.TransponderReceived += this.AsynchronousTransponder_Received;

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
        /// Disposes an instance of the CommandService class
        /// </summary>
        /// <param name="disposing">True to dispose managed as well as native resources</param>
        protected override void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    //this.displayResponder.Dispose();
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
    }
}
