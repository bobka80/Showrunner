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

    /// <summary>
    /// Identifies how to identify to access (read or write)
    /// </summary>
    public enum TargetTransponder
    {
        /// <summary>
        /// Do not target a particular transponder access any in range
        /// </summary>
        None,

        /// <summary>
        /// Target transponder(s) with the specified EPC
        /// </summary>
        ElectronicProductCode,

        /// <summary>
        /// Target transponder (s) with the specified TID
        /// </summary>
        TransponderIdentifier
    }

    /// <summary>
    /// View model to perform reads and write to a transponder or transponders
    /// </summary>
    public class ReadWriteViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for bank
        /// </summary>
        private Databank bank = Databank.User;

        /// <summary>
        /// Backing field for Data
        /// </summary>
        private string data = string.Empty;

        /// <summary>
        /// Backing field for OffsetWords
        /// </summary>
        private int offset = 0;

        /// <summary>
        /// Backing field for LengthWords
        /// </summary>
        private int length = 4;

        /// <summary>
        /// Backing field for Target
        /// </summary>
        private TargetTransponder target = TargetTransponder.ElectronicProductCode;

        /// <summary>
        /// Backing field for SelectMask
        /// </summary>
        private string selectMask = string.Empty;

        /// <summary>
        /// Backing field for AccessPassword
        /// </summary>
        private string accessPassword = string.Empty;

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
        /// Initializes a new instance of the ReadWriteViewModel class
        /// </summary>
        public ReadWriteViewModel(ICommandService commander, 
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
            this.ReadCommand = new ReaderCommand(this.ExecuteRead, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.WriteCommand = new ReaderCommand(this.ExecuteWrite, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.WriteSingleCommand = new ReaderCommand(this.ExecuteWriteSingle, ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets or sets the access password to use with the transponder access commands
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
        /// Gets or sets the data to use as the source of the select mask
        /// </summary>
        /// <remarks>
        /// When targetting by EPC this should be a transponder EPC.
        /// When targetting by TID this should be a transponder TID.
        /// When targetting by None this field is ignored
        /// </remarks>
        public string SelectMask
        {
            get
            {
                return this.selectMask;
            }

            set
            {
                if (this.selectMask != value)
                {
                    this.selectMask = value;
                    this.OnPropertyChanged("SelectMask");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating how the transponders to be accessed are identified
        /// </summary>
        public TargetTransponder Target
        {
            get
            {
                return this.target;
            }

            set
            {
                if (this.target != value)
                {
                    this.target = value;
                    this.OnPropertyChanged("Target");
                }
            }
        }

        /// <summary>
        /// Gets the command that performs a read
        /// </summary>
        public ICommand ReadCommand { get; private set; }

        /// <summary>
        /// Gets the command that performs a write
        /// </summary>
        public ICommand WriteCommand { get; private set; }

        /// <summary>
        /// Gets the command that performs a write single
        /// </summary>
        public ICommand WriteSingleCommand { get; private set; }

        /// <summary>
        /// Performs a read
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteRead(object parameter)
        {
            ReadTransponderCommand readCommand;

            readCommand = new ReadTransponderCommand();
            readCommand.TransponderReceived += this.Synchronous_TransponderReceived;

            try
            {
                readCommand.AccessPassword = this.AccessPassword;
                readCommand.Bank = this.Bank;
                readCommand.ApplyTransponderParametersFrom(commonParameters);
                readCommand.IncludeDateTime = commonParameters.IncludeDateTime;

                readCommand.Length = this.LengthWords;
                readCommand.Offset = this.OffsetWords;
                readCommand.OutputPower = commonParameters.OutputPower;
                readCommand.QuerySelect = QuerySelect.All;
                readCommand.QuerySession = QuerySession.S1;
                readCommand.QueryTarget = QueryTarget.TargetB;
                readCommand.QValue = 0;                
                readCommand.SelectAction = SelectAction.DeassertSetBNotAssertSetA;
                readCommand.SelectTarget = SelectTarget.S1;
                readCommand.UseAlert = commonParameters.UseAlert;

                switch (this.Target)
                {
                    case TargetTransponder.ElectronicProductCode:
                        // validate the SelectMask is valid hex
                        DataBlock epc = new DataBlock(this.SelectMask);
                        readCommand.InventoryOnly = TriState.No;
                        readCommand.SelectBank = Databank.ElectronicProductCode;
                        readCommand.SelectData = epc.Base16;
                        readCommand.SelectLength = epc.LengthBits;
                        readCommand.SelectOffset = 32; // EPC value starts from word 2
                        break;

                    case TargetTransponder.TransponderIdentifier:
                        DataBlock tid = new DataBlock(this.SelectMask);
                        readCommand.SelectBank = Databank.TransponderIdentifier;
                        readCommand.SelectData = tid.Base16;
                        readCommand.SelectLength = tid.LengthBits;
                        readCommand.SelectOffset = 0;
                        break;

                    default:
                        readCommand.InventoryOnly = TriState.Yes;
                        readCommand.QueryTarget = QueryTarget.TargetA;
                        break;
                }                

                // readCommand.ReadParameters;
                // readCommand.ResetParameters;
                // readCommand.TakeNoAction;
                this.commander.Execute(readCommand, true);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
            finally
            {
                readCommand.TransponderReceived -= this.Synchronous_TransponderReceived;
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
            write.TransponderReceived += this.Synchronous_TransponderReceived;

            try
            {
                data = new DataBlock(this.Data); // validate hex data                
                write.AccessPassword = this.AccessPassword;
                write.Bank = this.Bank;
                write.Data = data.Base16;
                write.ApplyTransponderParametersFrom(commonParameters);
                write.IncludeDateTime = commonParameters.IncludeDateTime;
                write.Length = data.LengthWords;
                write.Offset = this.OffsetWords;
                write.OutputPower = commonParameters.OutputPower;
                write.QuerySelect = QuerySelect.All;
                write.QuerySession = QuerySession.S1;
                write.QueryTarget = QueryTarget.TargetB;
                write.QValue = 0;                
                write.SelectAction = SelectAction.DeassertSetBNotAssertSetA;
                write.SelectTarget = SelectTarget.S1;
                write.UseAlert = commonParameters.UseAlert;
                write.WriteExtensions = null;
                write.WriteMode = null;

                switch (this.Target)
                {
                    case TargetTransponder.ElectronicProductCode:
                        DataBlock epc = new DataBlock(this.SelectMask);
                        write.InventoryOnly = TriState.No;
                        write.SelectBank = Databank.ElectronicProductCode;
                        write.SelectData = epc.Base16;
                        write.SelectLength = epc.LengthBits;
                        write.SelectOffset = 32; // EPC starts at words address 2 in EPC memory bank
                        break;

                    case TargetTransponder.TransponderIdentifier:
                        DataBlock tid = new DataBlock(this.SelectMask);
                        write.InventoryOnly = TriState.No;
                        write.SelectBank = Databank.TransponderIdentifier;
                        write.SelectData = tid.Base16;
                        write.SelectLength = tid.LengthBits;
                        write.SelectOffset = 0;
                        break;

                    default:
                        write.InventoryOnly = TriState.Yes; // don't perform a select
                        write.QueryTarget = QueryTarget.TargetA;
                        break;
                }                

                // write.ReadParameters;
                // write.ResetParameters;
                // write.TakeNoAction;
                this.commander.Execute(write, true);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
            finally
            {
                write.TransponderReceived -= this.Synchronous_TransponderReceived;
            }
        }

        /// <summary>
        /// Performs a write to a single transponder using the WriteSingle command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteWriteSingle(object parameter)
        {
            DataBlock data;
            WriteSingleTransponderCommand write;

            write = new WriteSingleTransponderCommand();
            write.TransponderReceived += this.Synchronous_TransponderReceived;

            try
            {
                data = new DataBlock(this.Data);
                
                write.AccessPassword = this.AccessPassword;
                write.Bank = this.Bank;
                write.Data = data.Base16;

                write.ApplyTransponderParametersFrom(commonParameters);
                write.IncludeDateTime = commonParameters.IncludeDateTime;                
                write.Length = data.LengthWords;
                write.Offset = this.OffsetWords;
                write.OutputPower = commonParameters.OutputPower;
                
                switch (this.Target)
                {
                    case TargetTransponder.ElectronicProductCode:
                        DataBlock epc = new DataBlock(this.SelectMask);
                        write.SelectBank = Databank.ElectronicProductCode;
                        write.SelectData = epc.Base16;
                        write.SelectLength = epc.LengthBits;
                        write.SelectOffset = 32; // EPC starts at words address 2 in EPC memory bank
                        break;

                    case TargetTransponder.TransponderIdentifier:
                        DataBlock tid = new DataBlock(this.SelectMask);
                        write.SelectBank = Databank.TransponderIdentifier;
                        write.SelectData = tid.Base16;
                        write.SelectLength = tid.LengthBits;
                        write.SelectOffset = 0;
                        break;

                    default:
                        throw new InvalidOperationException("WriteSingle must target a transponder");
                }

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
            finally
            {
                write.TransponderReceived -= this.Synchronous_TransponderReceived;
            }
        }

        /// <summary>
        /// Use the message service to report any transponders captured
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided with the event</param>
        private void Synchronous_TransponderReceived(object sender, TransponderDataEventArgs e)
        {
            this.messages.DisplayMessage(true, e.Transponder);
            this.identifierCache.AddTransponder(e.Transponder);
        }
    }
}
