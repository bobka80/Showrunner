//-----------------------------------------------------------------------
// <copyright file="ResponseSettingsAdapter.cs" company="Technology Solutions UK Ltd"> 
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
    /// Defines settings used by the response view model
    /// </summary>
    public interface IObservableResponseSettings
        : INotifyPropertyChanged
    {
        /// <summary>
        /// Gets or sets a value indicating whether the protocol response window is visible
        /// </summary>
        bool IsProtocolResponsePanelVisible { get; set; }
    }

    /// <summary>
    /// Implements an adapter to provide <see cref="IResponseSettings"/> from the application settings
    /// </summary>
    public class ResponseSettingsAdapter
        : SettingsEntityBase, IObservableResponseSettings 
    {
        /// <summary>
        /// Initializes a new instance of the ResponseSettingsAdapter class
        /// </summary>
        public ResponseSettingsAdapter()
            : base("Response")
        {            
        }

        /// <summary>
        /// Gets or sets a value indicating whether the protocol response window is visible
        /// </summary>
        public bool IsProtocolResponsePanelVisible 
        {
            get
            {
                return this.Settings.ResponseIsProtocolResponsePanelVisible;
            }
            
            set
            {
                this.Settings.ResponseIsProtocolResponsePanelVisible = value;
            }
        }
    }
}
