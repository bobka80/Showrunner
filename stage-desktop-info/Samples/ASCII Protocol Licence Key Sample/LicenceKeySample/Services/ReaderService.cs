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
    /// Provides a service to connect to and communicate with an ASCII reader
    /// </summary>
    public class ReaderService
        : IReaderCommand, IReaderConnect, IDisposable
    {
        /// <summary>
        /// The commander used to communicate with the reader
        /// </summary>
        private AsciiCommander commander;

        /// <summary>
        /// True once an instance is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// Backing field for IsConnected
        /// </summary>
        private bool isConnected;

        /// <summary>
        /// Backing field for IsExecutingCommand;
        /// </summary>
        private bool isExecutingCommand;

        /// <summary>
        /// Initializes a new instance of the ReaderService class
        /// </summary>
        /// <param name="barcodeResponder">
        /// A BarcodeCommand to insert into the responder chain to capture asynchronous barcode reads
        /// </param>
        /// <param name="inventoryResponder">
        /// An InventoryCommand to insert into the responder chain to capture aysyncrhonous transponder inventory
        /// </param>
        public ReaderService(BarcodeCommand barcodeResponder, InventoryCommand inventoryResponder)
        {
            this.commander = new AsciiCommander();
            this.commander.AddResponder(new LoggerResponder());
            this.commander.AddSynchronousResponder();
            this.commander.AddResponder(inventoryResponder.Responder);
            this.commander.AddResponder(barcodeResponder.Responder);
        }        

        /// <summary>
        /// Raised when IsConnected changes
        /// </summary>
        public event EventHandler IsConnectedChanged;

        /// <summary>
        /// Raised when IsExecutingCommand changes
        /// </summary>
        public event EventHandler IsExecutingCommandChanged;

        /// <summary>
        /// Gets the name of the port we last connected to
        /// </summary>
        public string ConnectionName { get; private set; }

        /// <summary>
        /// Gets a value indicating whether a command is currently being executed
        /// </summary>
        public bool IsExecutingCommand
        {
            get
            {
                return this.isExecutingCommand;
            }

            private set
            {
                if (this.isExecutingCommand != value)
                {
                    this.isExecutingCommand = value;
                    this.OnIsExecutingCommandChanged();
                }
            }
        }

        /// <summary>
        /// Gets a value indicating whether the reader is connected
        /// </summary>
        public bool IsConnected
        {
            get
            {
                return this.isConnected;
            }

            private set
            {
                if (this.isConnected != value)
                {
                    this.isConnected = value;
                    this.OnIsConnectedChanged();
                }
            }
        }

        /// <summary>
        /// Gets the <see cref="IAsciiCommandExecuting"/> to configure the ReponseChain and use for commands
        /// </summary>
        public IAsciiCommandExecuting AsciiCommander
        {
            get
            {
                return this.commander;
            }
        }

        /// <summary>
        /// Connects to the reader using the specified connectionName
        /// </summary>
        /// <param name="connectionName">The name of connection to connect with</param>
        /// <returns>True if the reader is connected</returns>
        public bool Connect(string connectionName)
        {
            if (this.IsConnected)
            {
                if (this.ConnectionName != connectionName)
                {
                    this.Disconnect();
                }
            }

            if (!this.IsConnected)
            {
                this.ConnectionName = connectionName;
                this.commander.Connect(new SerialPortWrapper(this.ConnectionName));
            }

            this.IsConnected = this.commander.IsConnected;
            return this.IsConnected;
        }

        /// <summary>
        /// Disconnects from a currently connected reader
        /// </summary>
        public void Disconnect()
        {
            if (this.IsConnected)
            {
                this.commander.Disconnect();
            }

            this.IsConnected = false;
        }

        /// <summary>
        /// Returns the names of potential reader connections
        /// </summary>
        /// <returns>
        /// The names of the connections
        /// </returns>
        /// <remarks>
        /// Althougth this is currently serial ports we may implement a direct to Bluetooth and
        /// return Bluetooth frindly names
        /// </remarks>
        public IEnumerable<string> EnumerateConnectionNames()
        {
            // TODO: this has a bug in some versions of the .NET framework
            // replace with the solution that accesses the registry directly
            return System.IO.Ports.SerialPort.GetPortNames();
        }

        /// <summary>
        /// Performs the specified ASCII connect
        /// </summary>
        /// <param name="command">The command to execute</param>
        /// <param name="synchronous">True to execute the command synchronously, false to execute asynchronously</param>
        public void ExecuteAsciiCommand(IAsciiCommand command, bool synchronous)
        {
            if (!this.IsConnected)
            {
                throw new InvalidOperationException("not connected");
            }
            else if (this.IsExecutingCommand)
            {
                throw new InvalidOperationException("reader busy performing another command");
            }            

            try
            {
                AsciiCommandBase asciiCommand;

                this.IsExecutingCommand = true;

                asciiCommand = command as AsciiCommandBase;

                this.AsciiCommander.ExecuteCommand(command, synchronous ? asciiCommand.Responder : null);
            }
            finally
            {
                this.IsExecutingCommand = false;
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
        /// Disposes an instance of the ReaderService class
        /// </summary>
        /// <param name="disposing">True to dispose managed as well as unmanaged resources</param>
        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    if (this.IsConnected)
                    {
                        this.Disconnect();
                    }
                }

                this.disposed = true;
            }
        }

        /// <summary>
        /// Raises the StateChanged event
        /// </summary>
        protected virtual void OnIsConnectedChanged()
        {
            EventHandler handler;

            handler = this.IsConnectedChanged;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }

        /// <summary>
        /// Raises the StateChanged event
        /// </summary>
        protected virtual void OnIsExecutingCommandChanged()
        {
            EventHandler handler;

            handler = this.IsExecutingCommandChanged;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }
    }
}
