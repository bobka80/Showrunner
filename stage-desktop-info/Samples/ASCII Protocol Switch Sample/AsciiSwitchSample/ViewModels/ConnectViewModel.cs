//-----------------------------------------------------------------------
// <copyright file="ConnectViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;

    /// <summary>
    /// View model used to connect to a UHF Reader
    /// </summary>
    public class ConnectViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for port names
        /// </summary>
        private IEnumerable<string> portNames;

        /// <summary>
        /// Backing field for connection status
        /// </summary>
        private string connectionStatus;        

        /// <summary>
        /// Initializes a new instance of the ConnectViewModel class
        /// </summary>
        public ConnectViewModel()
            : base()
        {
            this.ConnectCommand = new ReaderCommand(this.Connect, ReaderCommandCanExecute.WhenDisconnected);
            this.DisconnectCommand = new ReaderCommand(this.Disconnect, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.RefreshPortsCommand = new ReaderCommand(this.RefreshPorts, ReaderCommandCanExecute.Always);
            this.RefreshPorts(null);
            this.connectionStatus = "Disconnected";
        }

        /// <summary>
        /// Gets the command to connect to a reader
        /// </summary>
        public ICommand ConnectCommand { get; private set; }

        /// <summary>
        /// Gets the command to disconnect from a reader
        /// </summary>
        public ICommand DisconnectCommand { get; private set; }

        /// <summary>
        /// Gets the command to refresh the list of ports available
        /// </summary>
        public ICommand RefreshPortsCommand { get; private set; }

        /// <summary>
        /// Gets a value indicating the connection status of the device
        /// </summary>
        public string ConnectionStatus
        {
            get
            {
                return this.connectionStatus;
            }

            private set
            {
                if (this.connectionStatus != value)
                {
                    this.connectionStatus = value;
                    this.OnPropertyChanged("ConnectionStatus");
                }
            }
        }

        /// <summary>
        /// Gets or sets the selected port name
        /// </summary>
        public string PortName
        {
            get
            {
                return Service.Reader.PortName;
            }

            set
            {
                if (Service.Reader.PortName != value)
                {
                    Service.Reader.PortName = value;
                }

                this.OnPropertyChanged("PortName");
            }
        }

        /// <summary>
        /// Gets or sets the port names available for selection
        /// </summary>
        public IEnumerable<string> PortNames
        {
            get
            {
                return this.portNames;
            }

            set
            {
                if (this.portNames != value)
                {
                    this.portNames = value;
                    this.OnPropertyChanged("PortNames");
                }
            }
        }        

        /// <summary>
        /// Connects to the reader
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void Connect(object parameter)
        {
            Service.Reader.Connect();
            string messageFormat = Service.Reader.IsConnected ? "Connected on {0}" : "Unable to Connect to {0}";
            this.ConnectionStatus = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                messageFormat,
                this.PortName);
            this.OnPropertyChanged("IsConnected");
        }

        /// <summary>
        /// Disconnects from the reader
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void Disconnect(object parameter)
        {
            Service.Reader.Disconnect();
            this.ConnectionStatus = "Disconnected";
            this.OnPropertyChanged("IsConnected");
        }

        /// <summary>
        /// Refreshes the list of available ports that a reader may be connected to
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void RefreshPorts(object parameter)
        {
            this.PortNames = System.IO.Ports.SerialPort.GetPortNames();
        }
    }
}
