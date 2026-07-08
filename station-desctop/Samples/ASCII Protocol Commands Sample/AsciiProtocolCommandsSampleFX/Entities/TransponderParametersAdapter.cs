//-----------------------------------------------------------------------
// <copyright file="TransponderParametersAdapter.cs" company="Technology Solutions UK Ltd"> 
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
    /// Defines an observable version of <see cref="ITransponderParameters"/>
    /// </summary>
    public interface IObservableTransponderParameters
        : ITransponderParameters, System.ComponentModel.INotifyPropertyChanged
    {
    }

    /// <summary>
    /// Implements an adapter to provide <see cref="ITransponderParameters"/> from the application settings
    /// </summary>
    public class TransponderParametersAdapter
        : SettingsEntityBase, IObservableTransponderParameters
    {
        /// <summary>
        /// Initializes a new instance of the TransponderParametersAdapter class
        /// </summary>
        public TransponderParametersAdapter()
            : base("TransponderParameters")
        {
        }

        /// <summary>
        /// Gets or sets a value indicating whether the checksum is output for each transponder encountered
        /// </summary>
        public TriState? IncludeChecksum
        {
            get
            {
                return this.Settings.TransponderParametersIncludeChecksum.ToTriState();
            }

            set
            {
                this.Settings.TransponderParametersIncludeChecksum = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the index is output for each transponder encountered
        /// </summary>
        public TriState? IncludeIndex
        {
            get
            {
                return this.Settings.TransponderParametersIncludeIndex.ToTriState();
            }

            set
            {
                this.Settings.TransponderParametersIncludeIndex = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the PC word is output for each transponder encountered
        /// </summary>
        public TriState? IncludePC
        {
            get
            {
                return this.Settings.TransponderParametersIncludePC.ToTriState();
            }

            set
            {
                this.Settings.TransponderParametersIncludeIndex = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the RSSI is output for each transponder encountered
        /// </summary>
        public TriState? IncludeTransponderRssi
        {
            get
            {
                return this.Settings.TransponderParametersIncludeTransponderRssi.ToTriState();
            }

            set
            {
                this.Settings.TransponderParametersIncludeTransponderRssi = value.ToSetting();
            }
        }
    }
}
