//-----------------------------------------------------------------------
// <copyright file="ReadWriteViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    /// View model to perform reads and write to a transponder or transponders
    /// </summary>
    public class ReadWriteViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for AccessPassword
        /// </summary>
        private string accessPassword = string.Empty;

        /// <summary>
        /// Backing field for bank
        /// </summary>
        private Databank bank = Databank.User;

        /// <summary>
        /// Backing field for Data
        /// </summary>
        private string data = string.Empty;

        /// <summary>
        /// Backing field for KillPassword
        /// </summary>
        private string killPassword = string.Empty;

        /// <summary>
        /// Backing field for LengthWords
        /// </summary>
        private int length = 4;

        /// <summary>
        /// Backing field for OffsetWords
        /// </summary>
        private int offset = 0;

        /// <summary>
        /// Backing field for ValueOfQ
        /// </summary>
        private int valueOfQ = 0;

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
        /// Initializes a new instance of the ReadWriteViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        /// <param name="parameters">The parameters for the command</param>
        public ReadWriteViewModel(ICommandService commander, IMessageService messages, ICommonCommandParameters parameters)
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

            this.LockCommand = new ReaderCommand(this.ExecuteLock, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ReadCommand = new ReaderCommand(this.ExecuteRead, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.SelectDataEpcCommand = new DelegateCommand(this.ExecuteSelectEpc, DelegateCommand.CanExecuteAlways);
            this.SelectDataNoneCommand = new DelegateCommand(this.ExecuteSelectNone, DelegateCommand.CanExecuteAlways);
            this.SelectDataTidCommand = new DelegateCommand(this.ExecuteSelectTid, DelegateCommand.CanExecuteAlways);
            this.WriteCommand = new ReaderCommand(this.ExecuteWrite, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.WriteSingleCommand = new ReaderCommand(this.ExecuteWriteSingle, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.Lock = new LockParametersViewModel();
        }

        /// <summary>
        /// Gets the available databanks to select from
        /// </summary>
        public IList<Databank> Banks
        {
            get
            {
                return (Databank[])Enum.GetValues(typeof(Databank));
            }
        }

        /// <summary>
        /// Gets or sets the memory bank to access
        /// </summary>
        public Databank Bank
        {
            get
            {
                return this.bank;
            }

            set
            {
                if (this.bank != value)
                {
                    this.bank = value;
                    this.OnPropertyChanged("Bank");
                }
            }
        }

        /// <summary>
        /// Gets or sets the Data to write
        /// </summary>
        public string Data
        {
            get
            {
                return this.data;
            }

            set
            {
                if (this.data != value)
                {
                    this.data = value;
                    this.OnPropertyChanged("Data");
                }
            }
        }        

        /// <summary>
        /// Gets or sets the number of words to read
        /// </summary>
        public int LengthWords
        {
            get
            {
                return this.length;
            }

            set
            {
                if (value < 0)
                {
                    throw new ArgumentOutOfRangeException("value");
                }

                if (this.length != value)
                {
                    this.length = value;
                    this.OnPropertyChanged("LengthWords");
                }
            }
        }

        /// <summary>
        /// Gets or sets the offset into the memory bank to read or write from
        /// </summary>
        public int OffsetWords
        {
            get
            {
                return this.offset;
            }

            set
            {
                if (value < 0)
                {
                    throw new ArgumentOutOfRangeException("value");
                }

                if (this.offset != value)
                {
                    this.offset = value;
                    this.OnPropertyChanged("OffsetWords");
                }
            }
        }

        /// <summary>
        /// Gets or sets the access password to use
        /// </summary>
        public string AccessPassword 
        {
            get
            {
                return this.accessPassword;
            }

            set
            {
                if (this.accessPassword != value)
                {
                    this.accessPassword = value;
                    this.OnPropertyChanged("AccessPassword");
                }
            }
        }

        /// <summary>
        /// Gets or sets the kill password
        /// </summary>
        public string KillPassword
        {
            get
            {
                return this.killPassword;
            }

            set
            {
                if (this.killPassword != value)
                {
                    this.killPassword = value;
                    this.OnPropertyChanged("KillPassword");
                }
            }
        }

        /// <summary>
        /// Gets or sets the value of Q to use for the command
        /// </summary>
        public int QValue
        {
            get
            {
                return this.valueOfQ;
            }

            set
            {
                if (this.valueOfQ != value)
                {
                    this.valueOfQ = value;
                    this.OnPropertyChanged("QValue");
                }
            }
        }

        /// <summary>
        /// Gets the parameters relating to locking a transponder
        /// </summary>
        public LockParametersViewModel Lock { get; private set; }

        /// <summary>
        /// Gets the command that performs a lock
        /// </summary>
        public ICommand LockCommand { get; private set; }

        /// <summary>
        /// Gets the command that performs a read
        /// </summary>
        public ICommand ReadCommand { get; private set; }

        /// <summary>
        /// Gets the command that sets the select parameters assuming data is an EPC
        /// </summary>
        public ICommand SelectDataEpcCommand { get; private set; }

        /// <summary>
        /// Gets the command that sets the select parameters to read all transponders in field
        /// </summary>
        public ICommand SelectDataNoneCommand { get; private set; }

        /// <summary>
        /// Gets the command that sets the select parameters assuming data is an TID
        /// </summary>
        public ICommand SelectDataTidCommand { get; private set; }

        /// <summary>
        /// Gets the command that performs a write
        /// </summary>
        public ICommand WriteCommand { get; private set; }

        /// <summary>
        /// Gets the command that performs a write single
        /// </summary>
        public ICommand WriteSingleCommand { get; private set; }

        /// <summary>
        /// Performs the lock command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteLock(object parameter)
        {
            LockCommand lockCommand;

            lockCommand = new LockCommand();

            try
            {
                lockCommand.AccessPassword = this.AccessPassword;
                lockCommand.ApplyAntennaParameters(this.parameters.Antenna);
                lockCommand.ApplyQueryParameters(this.parameters.Query);
                lockCommand.ApplyResponseParameters(this.parameters.Response);
                lockCommand.ApplySelectParameters(this.parameters.Select);
                lockCommand.ApplyTransponderParameters(this.parameters.Transponder);
                
                // set the permissions
                lockCommand.LockPayload = this.Lock.Payload;

                lockCommand.QValue = this.QValue;         

                // readCommand.ReadParameters;
                // readCommand.ResetParameters;
                // readCommand.TakeNoAction;
                this.commander.Execute(lockCommand, true);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Performs a read
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteRead(object parameter)
        {
            ReadTransponderCommand readCommand;

            readCommand = new ReadTransponderCommand();

            try
            {
                readCommand.AccessPassword = this.AccessPassword;
                readCommand.Bank = this.Bank;
                readCommand.ApplyAntennaParameters(this.parameters.Antenna);
                readCommand.ApplyQueryParameters(this.parameters.Query);
                readCommand.ApplyResponseParameters(this.parameters.Response);
                readCommand.ApplySelectParameters(this.parameters.Select);
                readCommand.ApplyTransponderParameters(this.parameters.Transponder);
                
                readCommand.Length = this.LengthWords;
                readCommand.Offset = this.OffsetWords;                

                readCommand.QValue = this.QValue;

                // readCommand.ReadParameters;
                // readCommand.ResetParameters;
                // readCommand.TakeNoAction;
                this.commander.Execute(readCommand, true);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Sets up the transponder access parameters to target a transponder by EPC
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSelectEpc(object parameter)
        {
            DataBlock epc;

            try
            {
                ISelectParameters select;
                IQueryParameters query;

                select = this.parameters.Select;
                query = this.parameters.Query;

                epc = new DataBlock(select.SelectData);
                query.QuerySelect = QuerySelect.All;
                query.QuerySession = QuerySession.S1;
                query.QueryTarget = QueryTarget.TargetB;

                select.SelectAction = SelectAction.DeassertSetBNotAssertSetA;
                select.SelectBank = Databank.ElectronicProductCode;
                select.SelectLength = epc.LengthBits;
                select.SelectOffset = 32;
                select.SelectTarget = SelectTarget.S1;
                select.InventoryOnly = TriState.No;

                this.QValue = 0;
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Sets up the transponder access parameters to select all transponders in the field
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSelectNone(object parameter)
        {
            DataBlock epc;

            try
            {
                ISelectParameters select;
                IQueryParameters query;

                select = this.parameters.Select;
                query = this.parameters.Query;

                epc = new DataBlock(select.SelectData);
                query.QuerySelect = QuerySelect.All;
                query.QuerySession = QuerySession.S1;
                query.QueryTarget = QueryTarget.TargetA;

                select.SelectAction = SelectAction.AssertSetANotDeassertSetB;
                select.SelectBank = Databank.ElectronicProductCode;
                select.SelectLength = 0;
                select.SelectOffset = 0;
                select.SelectTarget = SelectTarget.S1;
                select.InventoryOnly = TriState.No;

                this.QValue = 7;
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Sets up the transponder access parameters to target a transponder by TID
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSelectTid(object parameter)
        {
            DataBlock tid;

            try
            {
                ISelectParameters select;
                IQueryParameters query;

                select = this.parameters.Select;
                query = this.parameters.Query;

                tid = new DataBlock(select.SelectData);
                query.QuerySelect = QuerySelect.All;
                query.QuerySession = QuerySession.S1;
                query.QueryTarget = QueryTarget.TargetB;

                select.SelectAction = SelectAction.DeassertSetBNotAssertSetA;
                select.SelectBank = Databank.TransponderIdentifier;
                select.SelectLength = tid.LengthBits;
                select.SelectOffset = 0;
                select.SelectTarget = SelectTarget.S1;
                select.InventoryOnly = TriState.No;

                this.QValue = 0;
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Performs a write
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteWrite(object parameter)
        {
            DataBlock data;
            WriteTransponderCommand write;

            write = new WriteTransponderCommand();

            try
            {
                data = new DataBlock(this.Data); // validate hex data                
                write.AccessPassword = this.AccessPassword;
                write.Bank = this.Bank;
                write.Data = data.Base16;

                write.ApplyAntennaParameters(this.parameters.Antenna);
                write.ApplyQueryParameters(this.parameters.Query);
                write.ApplyResponseParameters(this.parameters.Response);
                write.ApplySelectParameters(this.parameters.Select);
                write.ApplyTransponderParameters(this.parameters.Transponder);
                
                write.Length = data.LengthWords;
                write.Offset = this.OffsetWords;

                // parameters
                write.QValue = this.QValue;
                
                write.WriteExtensions = null;
                write.WriteMode = null;                           

                // write.ReadParameters;
                // write.ResetParameters;
                // write.TakeNoAction;
                this.commander.Execute(write, true);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Performs a write to a single transponder using the WriteSingle command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteWriteSingle(object parameter)
        {
            DataBlock data;
            DataBlock selectData;
            WriteSingleTransponderCommand write;
            ISelectParameters select;

            write = new WriteSingleTransponderCommand();

            try
            {
                select = this.parameters.Select;

                data = new DataBlock(this.Data); // validate data to write is hex
                selectData = new DataBlock(select.SelectData); // validate select mask is hex
                
                // common parameters
                write.AccessPassword = this.AccessPassword;
                write.ApplyAntennaParameters(this.parameters.Antenna);
                write.ApplyResponseParameters(this.parameters.Response);
                write.ApplyTransponderParameters(this.parameters.Transponder);

                // select parameters
                write.SelectBank = select.SelectBank;
                write.SelectData = select.SelectData;
                write.SelectLength = select.SelectLength;
                write.SelectOffset = select.SelectOffset;               

                // data parameters
                write.Bank = this.Bank;
                write.Data = data.Base16;                
                write.Length = data.LengthWords;
                write.Offset = this.OffsetWords;                
                
                // write.ReadParameters;
                // write.ResetParameters;
                // write.TakeNoAction;
                // write.UseAlert;
                this.commander.Execute(write, true);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }
    }
}
