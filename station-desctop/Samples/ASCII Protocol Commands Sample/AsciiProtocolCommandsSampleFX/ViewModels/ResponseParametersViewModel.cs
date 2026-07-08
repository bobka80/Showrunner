//-----------------------------------------------------------------------
// <copyright file="ResponseParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    /// View model that provides access to <see cref="IResponseParameters"/>
    /// </summary>
    public class ResponseParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The parameters being manipulated
        /// </summary>
        private IObservableResponseParameters parameters;

        /// <summary>
        /// Initializes a new instance of the ResponseParametersViewModel class
        /// </summary>
        /// <param name="responseParameters">The parameters to view or modify</param>
        public ResponseParametersViewModel(IObservableResponseParameters responseParameters)
        {
            if (responseParameters == null)
            {
                throw new ArgumentNullException("responseParameters");
            }

            this.parameters = responseParameters;
            responseParameters.PropertyChanged += this.ResponseParameters_PropertyChanged;
        }

        /// <summary>
        /// Gets or sets a value indicating whether a timestamp is include in the response
        /// </summary>
        public bool? IncludeDateTime
        {
            get
            {
                return this.parameters.IncludeDateTime.ToNullableBool();
            }

            set
            {
                this.parameters.IncludeDateTime = value.ToNullableTriState();
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the reader generates an alert on a successful command execution
        /// </summary>
        public bool? UseAlert
        {
            get
            {
                return this.parameters.UseAlert.ToNullableBool();
            }

            set
            {
                this.parameters.UseAlert = value.ToNullableTriState();
            }
        }

        /// <summary>
        /// Pass on the property change from the entity to the view. Using this dispatches the call on the correct thread
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ResponseParameters_PropertyChanged(object sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            this.OnPropertyChanged(e.PropertyName);
        }
    }
}
