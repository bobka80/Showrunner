//-----------------------------------------------------------------------
// <copyright file="CommonParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    using Entities;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Provides a view model to manipuate the settings common to a number of patameters that are applied to them as they are executed
    /// </summary>
    public class CommonParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The common parameters that will be manipulated
        /// </summary>
        private ICommonParameters commonParameters;        

        /// <summary>
        /// Initializes a new instance of the CommonParametersViewModel class
        /// </summary>
        /// <param name="commonParameters">The common parameters that will be manipulated</param>
        public CommonParametersViewModel(ICommonParameters commonParameters)
        {
            if (commonParameters == null)
            {
                throw new ArgumentNullException("commonParameters");
            }

            this.commonParameters = commonParameters;
            this.commonParameters.PropertyChanged += this.CommonParameters_PropertyChanged;
        }

        /// <summary>
        /// Gets or sets a value indicating whether to include checksum information in reader responses
        /// </summary>
        public System.Windows.Forms.CheckState IncludeChecksum
        {
            get
            {
                return this.commonParameters.IncludeChecksum.ToCheckState();
            }

            set
            {
                this.commonParameters.IncludeChecksum = value.ToTriState();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether output is timestamped
        /// </summary>
        public System.Windows.Forms.CheckState IncludeDateTime
        {
            get
            {
                return this.commonParameters.IncludeDateTime.ToCheckState();
            }

            set
            {
                this.commonParameters.IncludeDateTime = value.ToTriState();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether to include index numbers for multiple values in reader responses
        /// </summary>
        public System.Windows.Forms.CheckState IncludeIndex
        {
            get
            {
                return this.commonParameters.IncludeIndex.ToCheckState();
            }

            set
            {
                this.commonParameters.IncludeIndex = value.ToTriState();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether to include the EPC PC value in reader responses
        /// </summary>
        public System.Windows.Forms.CheckState IncludePC
        {
            get
            {
                return this.commonParameters.IncludePC.ToCheckState();
            }

            set
            {
                this.commonParameters.IncludePC = value.ToTriState();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether to include RSSI value in reader responses
        /// </summary>
        public System.Windows.Forms.CheckState IncludeTransponderRssi
        {
            get
            {
                return this.commonParameters.IncludeTransponderRssi.ToCheckState();
            }

            set
            {
                this.commonParameters.IncludeTransponderRssi = value.ToTriState();
            }
        }

        /// <summary>
        /// Gets or sets the output power in dBm from 10 to 29
        /// </summary>
        public int OutputPower
        {
            get
            {
                return this.commonParameters.OutputPower.HasValue ? this.commonParameters.OutputPower.Value : 29;
            }

            set
            {
                if ((value < 10) || (value > 29))
                {
                    throw new ArgumentOutOfRangeException("value");
                }

                this.commonParameters.OutputPower = value;
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether an alert is actioned on success of a command
        /// </summary>
        public System.Windows.Forms.CheckState UseAlert
        {
            get
            {
                return this.commonParameters.UseAlert.ToCheckState();
            }

            set
            {
                this.commonParameters.UseAlert = value.ToTriState();
            }
        }       

        /// <summary>
        /// When the referenced common parameters has a value that changes notify the view
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void CommonParameters_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            // re-raise the property changed event but this time respect raising on the UI thread if required
            this.OnPropertyChanged(e.PropertyName);
        }
    }
}
