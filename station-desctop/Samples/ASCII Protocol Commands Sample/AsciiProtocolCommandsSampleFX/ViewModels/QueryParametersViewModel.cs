//-----------------------------------------------------------------------
// <copyright file="QueryParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// View model to manipulate <see cref="IQueryParameters"/>
    /// </summary>
    /// TODO: if we add the collection properties to the observable instance we don't need this class
    public class QueryParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The parameters being manipulated
        /// </summary>
        private IObservableQueryParameters parameters;

        /// <summary>
        /// Initializes a new instance of the QueryParametersViewModel class
        /// </summary>
        /// <param name="queryParameters">The parameters to manipulate</param>
        public QueryParametersViewModel(IObservableQueryParameters queryParameters)
        {
            if (queryParameters == null)
            {
                throw new ArgumentNullException("queryParameters");
            }

            this.parameters = queryParameters;
            queryParameters.PropertyChanged += this.Parameters_PropertyChanged;
        }

        /// <summary>
        /// Gets the available values for <see cref="QuerySelect"/>
        /// </summary>
        public ICollection<QuerySelect> QuerySelects
        {
            get
            {
                return (QuerySelect[])Enum.GetValues(typeof(QuerySelect));
            }
        }

        /// <summary>
        /// Gets the available values for <see cref="QuerySession"/>
        /// </summary>
        public ICollection<QuerySession> QuerySessions
        {
            get
            {
                return (QuerySession[])Enum.GetValues(typeof(QuerySession));
            }
        }

        /// <summary>
        /// Gets the available values for <see cref="QueryTarget"/>
        /// </summary>
        public ICollection<QueryTarget> QueryTargets
        {
            get
            {
                return (QueryTarget[])Enum.GetValues(typeof(QueryTarget));
            }
        }

        /// <summary>
        /// Gets or sets whether to query transponders by the selected flag (all means use QuerySession)
        /// </summary>
        public QuerySelect? QuerySelect
        {
            get
            {
                return this.parameters.QuerySelect;
            }

            set
            {
                this.parameters.QuerySelect = value;
            }
        }

        /// <summary>
        /// Gets or sets the session to query
        /// </summary>
        public QuerySession? QuerySession
        {
            get
            {
                return this.parameters.QuerySession;
            }

            set
            {
                this.parameters.QuerySession = value;
            }
        }

        /// <summary>
        /// Gets or sets whether the flag target to reruen
        /// </summary>
        public QueryTarget? QueryTarget
        {
            get
            {
                return this.parameters.QueryTarget;
            }

            set
            {
                this.parameters.QueryTarget = value;
            }
        }

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
