//-----------------------------------------------------------------------
// <copyright file="AntennaParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
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

    using Entities;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// View model that provides access to <see cref="IAntennaParameters"/>
    /// </summary>
    public class AntennaParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The antenna parameters to manipulate
        /// </summary>
        private IAntennaParameters parameters;

        /// <summary>
        /// Initializes a new instance of the AntennaParametersViewModel class
        /// </summary>
        /// <param name="antennaParameters">The antenna parameters to view / modify</param>
        public AntennaParametersViewModel(IObservableAntennaParameters antennaParameters)
        {
            if (antennaParameters == null)
            {
                throw new ArgumentNullException("antennaParameters");
            }

            this.parameters = antennaParameters;            
            antennaParameters.PropertyChanged += this.AntennaParameters_PropertyChanged;
        }

        /// <summary>
        /// Gets or sets the current output power setting in 10..29 dBm
        /// </summary>
        public int OutputPower
        {
            get
            {
                if (this.parameters.OutputPower.HasValue)
                {
                    return this.parameters.OutputPower.Value;
                }

                return 29;
            }

            set
            {
                this.parameters.OutputPower = value;
            }
        }

        /// <summary>
        /// Pass on the property change from the entity to the view. Using this dispatches the call on the correct thread
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void AntennaParameters_PropertyChanged(object sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            this.OnPropertyChanged(e.PropertyName);
        }
    }
}
