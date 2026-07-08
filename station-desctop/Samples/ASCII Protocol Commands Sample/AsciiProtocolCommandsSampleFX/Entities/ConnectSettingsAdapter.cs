//-----------------------------------------------------------------------
// <copyright file="ConnectSettingsAdapter.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Defines the settings used by the connect view model
    /// </summary>
    public interface IObservableConnectSettings
        : INotifyPropertyChanged
    {
        /// <summary>
        /// Gets or sets the name of the port thr reader was last connected on
        /// </summary>
        string PortName { get; set; }
    }

    /// <summary>
    /// Adapter to fetch an <see cref="IConnectSettings"/> instance from the application settings
    /// </summary>
    public class ConnectSettingsAdapter
        : SettingsEntityBase, IObservableConnectSettings
    {
        /// <summary>
        /// Initializes a new instance of the ConnectSettingsAdapter class
        /// </summary>
        public ConnectSettingsAdapter()
            : base("Connect")
        {
        }

        /// <summary>
        /// Gets or sets the name of the port thr reader was last connected on
        /// </summary>
        public string PortName
        {
            get
            {
                return this.Settings.ConnectPortName;
            }

            set
            {
                this.Settings.ConnectPortName = value;
            }
        }
    }
}
