//-----------------------------------------------------------------------
// <copyright file="AntennaParametersAdapter.cs" company="Technology Solutions UK Ltd"> 
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

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Defines an observable version of <see cref="IAntennaParameters"/>
    /// </summary>
    public interface IObservableAntennaParameters
        : IAntennaParameters, INotifyPropertyChanged
    {
    }

    /// <summary>
    /// Implements an adapter to provide <see cref="IAntennaParameters"/> from the application settings
    /// </summary>
    public class AntennaParametersAdapter
        : SettingsEntityBase, IObservableAntennaParameters
    {
        /// <summary>
        /// Initializes a new instance of the AntennaParametersAdapter class
        /// </summary>
        public AntennaParametersAdapter()
            : base("AntennaParameters")
        {
        }

        /// <summary>
        /// Gets or sets the output power in dBm from 10 to 29
        /// </summary>
        public int? OutputPower
        {
            get
            {
                return this.Settings.AntennaParametersOutputPower.ToInt();
            }

            set
            {
                this.Settings.AntennaParametersOutputPower = value.ToSetting();
            }
        }
    }
}
