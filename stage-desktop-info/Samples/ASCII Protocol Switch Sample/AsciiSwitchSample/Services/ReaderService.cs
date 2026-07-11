//-----------------------------------------------------------------------
// <copyright file="ReaderService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Provides a service to access the interface to the ASCII protocol UHF Reader
    /// </summary>
    public class ReaderService
        : IDisposable
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
        /// Initializes a new instance of the ReaderService class
        /// </summary>
        public ReaderService()
        {
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
        /// Clear the responder chain
        /// </summary>
        public void ClearResponders()
        {
            this.commander.ClearResponders();
        }

        /// <summary>
        /// Add responder to the responder chain
        /// </summary>
        /// <param name="responder">The responder to add</param>
        public void AddResponder(IAsciiCommandResponder responder)
        {
            this.commander.AddResponder(responder);
        }

        /// <summary>
        /// Add the synchronous responder to the responder chain
        /// </summary>
        public void AddSynchronousResponder()
        {
            this.commander.AddSynchronousResponder();
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
        public void ExecuteCommand(IAsciiCommand command, IAsciiCommandSynchronousResponder synchronousResponder)
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
                System.Diagnostics.Debug.WriteLine(ex.Message);
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
