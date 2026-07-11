//-----------------------------------------------------------------------
// <copyright file="ReaderService.cs" company="Technology Solutions UK Ltd"> 
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

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// Provides a service to access the interface to the ASCII protocol UHF Reader
    /// </summary>
    public class ReaderService
        : IDisposable, IConnectionService, ICommandService
    {
        /// <summary>
        /// True once this instance is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// True while connected to a reader
        /// </summary>
        private bool isConencted;

        /// <summary>
        /// True while executing a command
        /// </summary>
        private bool isInCommand;

        /// <summary>
        /// The commander that communicates with the reader
        /// </summary>
        private AsciiCommander commander;

        /// <summary>
        /// Backing field for Messages
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Initializes a new instance of the ReaderService class
        /// </summary>
        /// <param name="messageService">The message service to report to</param>
        public ReaderService(IMessageService messageService)
        {
            this.messages = messageService;
            this.commander = new AsciiCommander();
            this.PortName = "COM32";
        }

        /// <summary>
        /// Raised when <see cref="IsConnected"/> or <see cref="IsInCommand"/> changes
        /// </summary>
        public event EventHandler StateChanged;

        /// <summary>
        /// Gets or sets the name of the port used for <see cref="Connect"/>
        /// </summary>
        public string PortName { get; set; }

        /// <summary>
        /// Gets a value indicating whether the reader is connected
        /// </summary>
        public bool IsConnected
        {
            get
            {
                return this.isConencted;
            }

            private set
            {
                if (this.isConencted != value)
                {
                    this.isConencted = value;
                    this.OnStateChanged();
                }
            }
        }

        /// <summary>
        /// Gets a value indicating whether a command is currently being executed
        /// </summary>
        public bool IsInCommand
        {
            get
            {
                return this.isInCommand;
            }

            private set
            {
                if (this.isInCommand != value)
                {
                    this.isInCommand = value;
                    this.OnStateChanged();
                }
            }
        }

        /// <summary>
        /// Gets the messages service
        /// </summary>
        protected IMessageService Messages
        {
            get
            {
                return this.messages;
            }
        }

        /// <summary>
        /// Gets the ASCII commander
        /// </summary>
        protected AsciiCommandExecutorBase Commander
        {
            get
            {
                return this.commander;
            }
        }

        /// <summary>
        /// Execute the command specified
        /// </summary>
        /// <param name="command">The command to execute</param>
        /// <param name="isCommandSynchronous">
        /// True to execute the command synchronously.
        /// False to execute the command asynchronously.
        /// </param>
        /// <remarks>
        /// Synchronous commands block until complete and the command response is updated with the response to the command 
        /// via the synchronous responder in the responder chain.
        /// Asynchonous commands return once the command is sent and the response is (hopefully) handled by other responders in the responder chain
        /// </remarks>
        public virtual void Execute(IAsciiCommand command, bool isCommandSynchronous)
        {
            IAsciiCommandSynchronousResponder synchronousResponder;
            AsciiCommandBase asciiCommand;

            try
            {
                asciiCommand = command as AsciiCommandBase;
                synchronousResponder = isCommandSynchronous ? asciiCommand.Responder : null;

                this.ExecuteCommand(command, synchronousResponder);
                if (isCommandSynchronous)
                {
                    // if we execute the command synchronously then the command is updated with the response
                    // if the command was not successful then there is one or more ME: headers with an error message
                    // lets show it.
                    if (!asciiCommand.Response.IsSuccessful)
                    {
                        foreach (string message in asciiCommand.Response.Messages)
                        {
                            this.Messages.IssueMessage(true, "Command", message);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                this.Messages.DisplayMessage(isCommandSynchronous, ex);
            }
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
        public virtual void ExecuteCommand(IAsciiCommand command, IAsciiCommandSynchronousResponder synchronousResponder)
        {
            try
            {
                this.IsInCommand = true;
                this.commander.ExecuteCommand(command, synchronousResponder);
            }
            finally
            {
                this.IsInCommand = false;
            }
        }

        /// <summary>
        /// Connects to the reader using the current <see cref="PortName"/>
        /// </summary>
        public void Connect()
        {
            try
            {
                IAsciiSerialPort serialPort = new SerialPortWrapper(this.PortName);
                this.commander.Connect(serialPort);
            }
            catch (Exception ex)
            {
                this.Messages.DisplayMessage(false, ex);
            }
            finally
            {
                this.IsConnected = this.commander.IsConnected;
            }
        }

        /// <summary>
        /// Disconnects from the current reader if connected
        /// </summary>
        public void Disconnect()
        {
            try
            {
                this.commander.Disconnect();
            }
            finally
            {
                this.IsConnected = this.commander.IsConnected;
            }
        }

        /// <summary>
        /// Disposes an instance of the ReaderService class
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Raises the <see cref="StateChanged"/> event
        /// </summary>
        protected virtual void OnStateChanged()
        {
            EventHandler handler;

            handler = this.StateChanged;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }

        /// <summary>
        /// Disposes an instance of the ReaderService class
        /// </summary>
        /// <param name="disposing">True to dispose managed as well as unmanaged resources</param>
        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    this.commander.Dispose();
                }

                this.disposed = true;
            }
        }
    }
}
