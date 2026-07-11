//-----------------------------------------------------------------------
// <copyright file="CommissionTransponderViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    /// View mode to commission a transponder
    /// </summary>
    public class CommissionTransponderViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for CurrentEpc
        /// </summary>
        private string currentEpc = string.Empty;

        /// <summary>
        /// Backing field for RequiredEpc
        /// </summary>
        private string requiredEpc = string.Empty;

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
        /// Initializes a new instance of the CommissionTransponderViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        /// <param name="parameters">The parameters for the command</param>
        public CommissionTransponderViewModel(ICommandService commander, IMessageService messages, ICommonCommandParameters parameters)
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

            this.ChangeEpcCommand = new ReaderCommand(this.ExecuteChangeEpc, ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets or sets the EPC that identifies the transponder to be written by the <see cref="ChangeEpcCommand"/>
        /// </summary>
        public string CurrentEpc
        {
            get
            {
                return this.currentEpc;
            }

            set
            {
                if (this.currentEpc != value)
                {
                    this.currentEpc = value;
                    this.OnPropertyChanged("CurrentEpc");
                }
            }
        }

        /// <summary>
        /// Gets or sets a the EPC that will be written to the transponder by the <see cref="ChangeEpcCommand"/>
        /// </summary>
        public string RequiredEpc
        {
            get
            {
                return this.requiredEpc;
            }

            set
            {
                if (this.requiredEpc != value)
                {
                    this.requiredEpc = value;
                    this.OnPropertyChanged("RequiredEpc");
                }
            }
        }

        /// <summary>
        /// Gets the command that changes the EPC of a transponder from
        /// <see cref="CurrentEpc"/> to <see cref="RequiredEpc"/>
        /// </summary>
        public ICommand ChangeEpcCommand { get; private set; }

        /// <summary>
        /// Gets the command that changes the EPC of a transponder from
        /// <see cref="CurrentEpc"/> to <see cref="RequiredEpc"/>.
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        /// <remarks>
        /// Will only change to an EPC of the same length. 
        /// To change the length of the EPC the PC word must also be updated
        /// </remarks>
        private void ExecuteChangeEpc(object parameter)
        {
            DataBlock current;
            DataBlock required;
            WriteSingleTransponderCommand write;

            write = new WriteSingleTransponderCommand();

            try
            {
                // validate input as hex 
                current = new DataBlock(this.CurrentEpc);
                required = new DataBlock(this.RequiredEpc);

                if (current.LengthWords != required.LengthWords)
                {
                    // we need to modify the PC word (the word before the start of the actual EPC in the EPC memory bank
                    throw new ArgumentException("Can only change EPC with same length EPC. PC word needs updating to change EPC length");
                }

                // use program's common parameters for common parameters
                // TODO: write.AccessPassword = this.AccessPassword;
                write.ApplyAntennaParameters(this.parameters.Antenna);
                write.ApplyResponseParameters(this.parameters.Response);
                write.ApplyTransponderParameters(this.parameters.Transponder);

                // we want to write the Required EPC to the EPC databank
                write.Bank = Databank.ElectronicProductCode;
                write.Data = required.Base16;
                write.Length = required.LengthWords;
                write.Offset = 2;

                // we identify the transponder to write by its current EPC
                write.SelectBank = Databank.ElectronicProductCode;
                write.SelectData = current.Base16;
                write.SelectLength = current.LengthBits;
                write.SelectOffset = 32; // EPC starts at words address 2 in EPC memory bank

                this.commander.Execute(write, true);

                if (write.Response.IsSuccessful && (write.WordsWritten == required.LengthWords))
                {
                    this.messages.IssueMessage(true, "Change EPC", "Success");
                }
                else
                {
                    this.messages.IssueMessage(true, "Change EPC", "Failed to write transponder");
                }
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }
    }
}
