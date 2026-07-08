//-----------------------------------------------------------------------
// <copyright file="CommonParameters.cs" company="Technology Solutions UK Ltd"> 
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
    /// Holds parameters that are common to many commands so that they can be set once
    /// </summary>
    internal class CommonParameters
        : ICommonParameters
    {
        /// <summary>
        /// Reference to the actual property values
        /// </summary>
        private Properties.Settings settings;

        /// <summary>
        /// Initializes a new instance of the CommonParameters class
        /// </summary>
        /// <param name="settings">Reference to the settings where the parameters are stored</param>
        public CommonParameters(Properties.Settings settings)
        {
            if (settings == null)
            {
                throw new ArgumentNullException("settings");
            }

            this.settings = settings;
            this.settings.PropertyChanged += this.Settings_PropertyChanged;
        }

        /// <summary>
        /// Raised when the value of a property changes
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// Gets or sets a value indicating whether CRC is output for each transponder
        /// </summary>
        public TriState? IncludeChecksum
        {
            get
            {
                return this.settings.CommonParametersIncludeChecksum.ToTriState();
            }

            set
            {
                this.settings.CommonParametersIncludeChecksum = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether output is timestamped
        /// </summary>
        public TriState? IncludeDateTime 
        {
            get
            {
                return this.settings.CommonParametersIncludeDateTime.ToTriState();
            }
            
            set
            {
                this.settings.CommonParametersIncludeDateTime = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether Index is output for each transponder
        /// </summary>
        public TriState? IncludeIndex 
        {
            get
            {
                return this.settings.CommonParametersIncludeIndex.ToTriState();
            }

            set
            {
                this.settings.CommonParametersIncludeIndex = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether PC is output for each transponder
        /// </summary>
        public TriState? IncludePC
        {
            get
            {
                return this.settings.CommonParametersIncludePC.ToTriState();
            }

            set
            {
                this.settings.CommonParametersIncludePC = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether RSSI is output for each transponder
        /// </summary>
        public TriState? IncludeTransponderRssi
        {
            get
            {
                return this.settings.CommonParametersIncludeTransponderRssi.ToTriState();
            }

            set
            {
                this.settings.CommonParametersIncludeTransponderRssi = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets the output power in dBm from 10 to 29
        /// </summary>
        public int? OutputPower
        {
            get
            {
                return this.settings.CommonParametersOutputPower.ToInt();
            }

            set
            {
                this.settings.CommonParametersOutputPower = value.ToSetting();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether an alert is actioned on success of a command
        /// </summary>
        public TriState? UseAlert
        {
            get
            {
                return this.settings.CommonParametersUseAlert.ToTriState();
            }

            set
            {
                this.settings.CommonParametersUseAlert = value.ToSetting();
            }
        }

        /// <summary>
        /// Raises the PropertyChanged event
        /// </summary>
        /// <param name="propertyName">The name of the property of which the value changed</param>
        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChangedEventHandler handler;

            handler = this.PropertyChanged;
            if (handler != null)
            {
                handler(this, new PropertyChangedEventArgs(propertyName));
            }
        }

        /// <summary>
        /// Maps the PropertyChanged event from the underlying settings to the name of the property that has changed
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Settings_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            switch (e.PropertyName)
            {
                case "CommonParametersIncludeChecksum":
                    this.OnPropertyChanged("IncludeChecksum");
                    break;

                case "CommonParametersIncludeDateTime":
                    this.OnPropertyChanged("IncludeDateTime");
                    break;

                case "CommonParametersIncludeIndex":
                    this.OnPropertyChanged("IncludeIndex");
                    break;

                case "CommonParametersIncludePC":
                    this.OnPropertyChanged("IncludePC");
                    break;

                case "CommonParametersIncludeTransponderRssi":
                    this.OnPropertyChanged("IncludeTransponderRssi");
                    break;

                case "CommonParametersOutputPower":
                    this.OnPropertyChanged("OutputPower");
                    break;

                case "CommonParametersUseAlert":
                    this.OnPropertyChanged("UserAlert");
                    break;
            }
        }
    }
}
