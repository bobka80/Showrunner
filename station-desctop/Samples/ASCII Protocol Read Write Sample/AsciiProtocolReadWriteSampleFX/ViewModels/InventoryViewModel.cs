//-----------------------------------------------------------------------
// <copyright file="InventoryViewModel.cs" company="Technology Solutions UK Ltd"> 
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

    using Entities;
    using Services;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// View model for main form
    /// </summary>
    /// TODO: add additional inventory parameters
    public class InventoryViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for <see cref="QuerySession"/>
        /// </summary>
        private QuerySession querySession;

        /// <summary>
        /// Backing field for <see cref="QueryTarget"/>
        /// </summary>
        private QueryTarget queryTarget;

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
        /// Common parameters for the commands
        /// </summary>
        private ICommonParameters commonParameters;

        /// <summary>
        /// Initializes a new instance of the InventoryViewModel class
        /// </summary>
        public InventoryViewModel(
            ICommandService commander, 
            IMessageService messages, 
            IIdentifierCache identifierCache, 
            ICommonParameters commonParameters)
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

            if (identifierCache == null)
            {
                throw new ArgumentNullException("identifierCache");
            }

            if (commonParameters == null)
            {
                throw new ArgumentNullException("commonParameters");
            }

            this.commander = commander;
            this.messages = messages;
            this.identifierCache = identifierCache;
            this.commonParameters = commonParameters;

            this.InventoryAsynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteInventoryCommand(false); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.InventorySynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteInventoryCommand(true); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets the inventory command that executes synchronously
        /// </summary>
        public ICommand InventoryAsynchronous { get; private set; }

        /// <summary>
        /// Gets the inventory command that executes asynchronously
        /// </summary>
        public ICommand InventorySynchronous { get; private set; }

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
        /// Execute the Inventory command
        /// </summary>
        /// <param name="isCommandSynchronous">
        /// True to execute the command synchronously
        /// False to execute the command asynchronously
        /// </param>
        private void ExecuteInventoryCommand(bool isCommandSynchronous)
        {
            try
            {
                InventoryCommand inventory;

                inventory = new InventoryCommand();
                
                // TODO: inventory.FastIdentifier;
                inventory.ApplyTransponderParametersFrom(this.commonParameters);
                inventory.IncludeDateTime = this.commonParameters.IncludeDateTime;                

                // inventory.InventoryOnly;
                inventory.OutputPower = this.commonParameters.OutputPower;

                // inventory.QAlgorithm;
                // inventory.QuerySelect;                
                inventory.QuerySession = this.Session;
                inventory.QueryTarget = this.Target;

                // inventory.QValue;
                // inventory.ReadParameters;
                // inventory.ResetParameters;
                // inventory.SelectAction;
                // inventory.SelectBank;
                // inventory.SelectData;
                // inventory.SelectLength;
                // inventory.SelectOffset;
                // inventory.SelectTarget;
                // TODO: inventory.TagFocus;
                // inventory.TakeNoAction;
                inventory.UseAlert = this.commonParameters.UseAlert;
                inventory.TransponderReceived += this.SynchronousTransponder_Received;

                try
                {
                    this.commander.Execute(inventory, isCommandSynchronous);
                }
                finally
                {
                    inventory.TransponderReceived -= this.SynchronousTransponder_Received;
                }
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(isCommandSynchronous, ex);
            }
        }

        /// <summary>
        /// Displays the transponder when a transponder is received synchronously from the
        /// synchronous responder in the responder chain
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousTransponder_Received(object sender, TransponderDataEventArgs e)
        {
            // TODO: consider holder local references to services rather than fetch for each transponder
            this.messages.DisplayMessage(true, e.Transponder);
            this.identifierCache.AddTransponder(e.Transponder);
        }
    }
}
