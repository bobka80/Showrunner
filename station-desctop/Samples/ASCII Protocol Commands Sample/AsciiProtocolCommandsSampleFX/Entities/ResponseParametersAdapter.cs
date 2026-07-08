//-----------------------------------------------------------------------
// <copyright file="ResponseParametersAdapter.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Defines an observable version of <see cref="IResponseParameters"/>
    /// </summary>
    public interface IObservableResponseParameters
        : IResponseParameters, System.ComponentModel.INotifyPropertyChanged
    {
    }

    /// <summary>
    /// Implements an adapter to provide <see cref="IResponseParameters"/> from the application settings
    /// </summary>
    public class ResponseParametersAdapter
        : SettingsEntityBase, IObservableResponseParameters
    {
        /// <summary>
        /// Initializes a new instance of the ResponseParametersAdapter class
        /// </summary>
        public ResponseParametersAdapter()
            : base("ResponseParameters")
        {
        }

        /// <summary>
        /// Gets or sets a value indicating whether the reader outputs a timestamp for the command
        /// </summary>
        public TriState? IncludeDateTime
        {
            get
            {
                return this.Settings.ResponseParametersIncludeDateTime.ToTriState();
            }

            set
            {
                this.Settings.ResponseParametersIncludeDateTime = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the reader performs an alert for successful execution of the command
        /// </summary>
        public TriState? UseAlert
        {
            get
            {
                return this.Settings.ResponseParametersUseAlert.ToTriState();
            }

            set
            {
                this.Settings.ResponseParametersUseAlert = value.ToSetting();
            }
        }
    }
}
