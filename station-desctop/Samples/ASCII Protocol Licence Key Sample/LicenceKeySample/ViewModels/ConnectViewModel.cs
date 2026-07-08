//-----------------------------------------------------------------------
// <copyright file="ConnectViewModel.cs" company="Technology Solutions UK Ltd"> 
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

    using Services;

    /// <summary>
    /// Represents a view model that provides a connection to a reader
    /// </summary>
    public class ConnectViewModel
        : TaskViewModelBase
    {
        /// <summary>
        /// Backing field for IsConnected
        /// </summary>
        private bool isConnected;

        /// <summary>
        /// Backing field for ConnectionName
        /// </summary>
        private string connectionName;

        /// <summary>
        /// Backing field for ConnectionStatus
        /// </summary>
        private string connectionStatus;

        /// <summary>
        /// Backing field for ConnectionNames
        /// </summary>
        private string[] connectionNames;

        /// <summary>
        /// Used to manage the connection to the reader
        /// </summary>
        private IReaderConnect readerConnect;

        /// <summary>
        /// Initializes a new instance of the ConnectViewModel class
        /// </summary>
        /// <param name="readerConnect">
        /// Provides a mechanism to manage the connection to the reader
        /// </param>
        public ConnectViewModel(IReaderConnect readerConnect)
        {
            if (readerConnect == null)
            {
                throw new ArgumentNullException("readerConnect");
            }

            this.connectionStatus = "Disconnected";
            this.readerConnect = readerConnect;
            this.IsConnected = this.readerConnect.IsConnected;
            this.ConnectionName = this.readerConnect.ConnectionName;

            this.connectionNames = this.readerConnect.EnumerateConnectionNames().ToArray();
        }

        /// <summary>
        /// Gets a value indicating whether <see cref="Connect"/> can be executed
        /// </summary>
        public bool CanExecuteConnect
        {
            get
            {
                return !this.IsBusy && !this.IsConnected;
            }
        }

        /// <summary>
        /// Gets a value indicating whether <see cref="Disconnect"/> can be executed
        /// </summary>
        public bool CanExecuteDisconnect
        {
            get
            {
                return !this.IsBusy && this.IsConnected;
            }
        }
        
        /// <summary>
        /// Gets a value indicating whether a reader is connected
        /// </summary>
        public bool IsConnected
        {
            get
            {
                return this.isConnected;
            }

            private set
            {
                this.SetProperty(ref this.isConnected, value, "IsConnected");
            }
        }

        /// <summary>
        /// Gets or sets the name of the connection to use to connect to the reader
        /// </summary>
        public string ConnectionName
        {
            get
            {
                return this.connectionName;
            }

            set
            {
                this.SetProperty(ref this.connectionName, value, "ConnectionName");
            }
        }

        /// <summary>
        /// Gets the ports available to connect to
        /// </summary>
        public string[] ConnectionNames
        {
            get
            {
                return this.connectionNames;
            }
        }

        /// <summary>
        /// Gets or sets the connection status
        /// </summary>
        public string ConnectionStatus
        {
            get
            {
                return this.connectionStatus;
            }

            set
            {
                this.SetProperty(ref this.connectionStatus, value, "ConnectionStatus");
            }
        }

        /// <summary>
        /// Connect to a reader
        /// </summary>
        public void ExecuteConnect()
        {
            this.PerformTask(
                this.CanExecuteConnect, 
                delegate
                {
                    try
                    {
                        this.readerConnect.Connect(this.ConnectionName);
                    }
                    finally
                    {
                        this.IsConnected = this.readerConnect.IsConnected;
                        this.ConnectionStatus = this.IsConnected ? "Connected to " + this.ConnectionName :
                            "Failed to connect to " + this.ConnectionName;
                    }
                });
        }

        /// <summary>
        /// Disconnect from a reader
        /// </summary>
        public void ExecuteDisconnect()
        {
            this.PerformTask(
                this.CanExecuteDisconnect, 
                delegate 
                {
                    try
                    {
                        this.readerConnect.Disconnect();
                        this.ConnectionStatus = "Disconnected";
                    }
                    finally
                    {
                        this.IsConnected = this.readerConnect.IsConnected;
                    }
                });
        }

        /// <summary>
        /// Capture changes to IsBusy and IsConnected to notify when derived properties change
        /// </summary>
        /// <param name="propertyName">The name of the property that changed value</param>
        protected override void OnPropertyChanged(string propertyName)
        {
            base.OnPropertyChanged(propertyName);

            switch (propertyName)
            {
                case "IsBusy":
                    this.OnPropertyChanged("CanExecuteConnect");
                    this.OnPropertyChanged("CanExecuteDisconnect");
                    break;

                case "IsConnected":
                    this.OnPropertyChanged("CanExecuteConnect");
                    this.OnPropertyChanged("CanExecuteDisconnect");
                    break;
            }
        }
    }
}
