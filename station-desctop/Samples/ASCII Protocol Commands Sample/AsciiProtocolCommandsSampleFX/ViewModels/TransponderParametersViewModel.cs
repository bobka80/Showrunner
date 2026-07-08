//-----------------------------------------------------------------------
// <copyright file="TransponderParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
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

    /// <summary>
    /// View model to manipulate the <see cref="ITransponderParameters"/>
    /// </summary>
    public class TransponderParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Initializes a new instance of the TransponderParametersViewModel class
        /// </summary>
        /// <param name="transponderParameters">The parameters to manipulate</param>
        public TransponderParametersViewModel(IObservableTransponderParameters transponderParameters)
        {
            this.Parameters = transponderParameters;
            if (this.Parameters != null)
            {
                this.Parameters.PropertyChanged += this.Parameters_PropertyChanged;
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the checksum is output for each transponder encountered
        /// </summary>
        public bool? IncludeChecksum
        {
            get
            {
                if (this.Parameters != null)
                {
                    return this.Parameters.IncludeChecksum.ToNullableBool();
                }

                return null;
            }

            set
            {
                if (this.Parameters != null)
                {
                    this.Parameters.IncludeChecksum = value.ToNullableTriState();
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the index is output for each transponder encountered
        /// </summary>
        public bool? IncludeIndex
        {
            get
            {
                if (this.Parameters != null)
                {
                    return this.Parameters.IncludeIndex.ToNullableBool();
                }

                return null;
            }

            set
            {
                if (this.Parameters != null)
                {
                    this.Parameters.IncludeChecksum = value.ToNullableTriState();
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the PC word is output for each transponder encountered
        /// </summary>
        public bool? IncludePC
        {
            get
            {
                if (this.Parameters != null)
                {
                    return this.Parameters.IncludePC.ToNullableBool();
                }

                return null;
            }

            set
            {
                if (this.Parameters != null)
                {
                    this.Parameters.IncludePC = value.ToNullableTriState();
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the RSSI is output for each transponder encountered
        /// </summary>
        public bool? IncludeTranspoderRssi
        {
            get
            {
                if (this.Parameters != null)
                {
                    return this.Parameters.IncludeTransponderRssi.ToNullableBool();
                }

                return null;
            }

            set
            {
                if (this.Parameters != null)
                {
                    this.Parameters.IncludeTransponderRssi = value.ToNullableTriState();
                }
            }
        }

        /// <summary>
        /// Gets or sets the parameters being manipulated
        /// </summary>
        private IObservableTransponderParameters Parameters { get; set; }

        /// <summary>
        /// Pass on the property change from the entity to the view. Using this dispatches the call on the correct thread
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Parameters_PropertyChanged(object sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            this.OnPropertyChanged(e.PropertyName);
        }
    }
}
