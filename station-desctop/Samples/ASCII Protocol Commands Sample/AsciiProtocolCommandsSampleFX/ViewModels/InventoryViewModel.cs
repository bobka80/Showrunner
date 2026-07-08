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
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;    

    /// <summary>
    /// View model for main form
    /// </summary>
    /// TODO: add additional inventory parameters
    public class InventoryViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for IsFastIdentifierEnabled
        /// </summary>
        private bool? isFastIdentifierEnabled;

        /// <summary>
        /// Backing field for IsTagFocusEnabled
        /// </summary>
        private bool? isTagFocusEnabled;

        /// <summary>
        /// To execute ASCII commands on the reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// To report messages to the user interface
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Parameters common to many commands
        /// </summary>
        private ICommonCommandParameters parameters;

        /// <summary>
        /// Initializes a new instance of the InventoryViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        /// <param name="parameters">The parameters for the command</param>
        public InventoryViewModel(ICommandService commander, IMessageService messages, ICommonCommandParameters parameters)
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

            if (parameters == null)
            {
                throw new ArgumentNullException("parameters");
            }

            this.commander = commander;
            this.messages = messages;
            this.parameters = parameters;

            this.InventoryAsynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteInventoryCommand(false); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.InventorySynchronous = new ReaderCommand(
                delegate(object state) { this.ExecuteInventoryCommand(true); },
                ReaderCommandCanExecute.WhenConnectedAndIdle);
        }        

        /// <summary>
        /// Gets or sets a value indicating whether fast identify mode is enabled (TID with inventory)
        /// </summary>
        public bool? IsFastIdentifierEnabled 
        {
            get
            {
                return this.isFastIdentifierEnabled;
            }

            set
            {
                if (this.isFastIdentifierEnabled != value)
                {
                    this.isFastIdentifierEnabled = value;
                    this.OnPropertyChanged("IsFastIdentifierEnabled");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether tag focus is enabled
        /// </summary>
        public bool? IsTagFocusEnabled 
        {
            get
            {
                return this.isTagFocusEnabled;
            }

            set
            {
                if (this.isTagFocusEnabled != value)
                {
                    this.isTagFocusEnabled = value;
                    this.OnPropertyChanged("IsTagFocusEnabled");

                    if (this.isTagFocusEnabled.HasValue && this.isTagFocusEnabled.Value)
                    {
                        IQueryParameters queryParameters;

                        // for tag focus to work. We need session 1. target A
                        queryParameters = this.parameters.Query;
                        queryParameters.QuerySession = QuerySession.S1;
                        queryParameters.QueryTarget = QueryTarget.TargetA;
                    }
                }
            }
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

                // TODO: 
                inventory.FastIdentifier = this.IsFastIdentifierEnabled.ToNullableTriState();
                inventory.ApplyAntennaParameters(this.parameters.Antenna);
                inventory.ApplyResponseParameters(this.parameters.Response);
                inventory.ApplyTransponderParameters(this.parameters.Transponder);

                inventory.ApplyQueryParameters(this.parameters.Query);
                inventory.ApplySelectParameters(this.parameters.Select);

                // inventory.QAlgorithm;
                // inventory.QValue;
                // inventory.ReadParameters;
                // inventory.ResetParameters;
                inventory.TagFocus = this.IsTagFocusEnabled.ToNullableTriState();

                // inventory.TakeNoAction;
                this.commander.Execute(inventory, isCommandSynchronous);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(isCommandSynchronous, ex);
            }
        }
    }
}
