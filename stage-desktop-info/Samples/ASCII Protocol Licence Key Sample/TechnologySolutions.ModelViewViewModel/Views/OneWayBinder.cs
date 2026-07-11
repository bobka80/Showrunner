//-----------------------------------------------------------------------
// <copyright file="OneWayBinder.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Views
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Reflection;
    using System.Text;

    /// <summary>
    /// Simple binder that binds an INotifyPropertyChanged property with a target property. As the DataSource.DataMember property changes
    /// Target.PropertyName is updated to match (one way)
    /// </summary>
    public class OneWayBinder
        : IDisposable
    {
        /// <summary>
        /// True once an instance is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// Information about the target property to update
        /// </summary>
        private PropertyInfo target;

        /// <summary>
        /// Information about the source property to update
        /// </summary>
        private PropertyInfo source;

        /// <summary>
        /// Initializes a new instance of the OneWayBinder class
        /// </summary>
        /// <param name="target">The target object with a property to update</param>
        /// <param name="propertyName">The name of the property on the target</param>
        /// <param name="dataSource">The source that implements INotifyPropertyChanged with a property to monitor</param>
        /// <param name="dataMember">The name of the property on the DataSource to data bind</param>
        public OneWayBinder(object target, string propertyName, object dataSource, string dataMember)
        {
            if (target == null)
            {
                throw new ArgumentNullException("target");
            }

            if (string.IsNullOrEmpty(propertyName))
            {
                throw new ArgumentNullException("propertyName");
            }

            if (dataSource == null)
            {
                throw new ArgumentNullException("dataSource");
            }

            if (string.IsNullOrEmpty(dataMember))
            {
                throw new ArgumentNullException("dataMember");
            }

            this.Target = target;
            this.PropertyName = propertyName;
            this.DataSource = dataSource;
            this.DataMember = dataMember;

            try
            {
                this.target = this.Target.GetType().GetProperty(this.PropertyName);
                if (this.target == null)
                {
                    throw new ArgumentException("PropertyName is not present on target");
                }
            }
            catch (AmbiguousMatchException ame)
            {
                throw new ArgumentException("failed to identify PropertyName", ame);
            }
            catch (ArgumentException ae)
            {
                throw new ArgumentException("failed to identify PropertyName", ae);
            }

            try
            {
                this.source = this.DataSource.GetType().GetProperty(this.DataMember);
                if (this.source == null)
                {
                    throw new ArgumentNullException("DataMember is not present on source");
                }            
            }
            catch (AmbiguousMatchException ame)
            {
                throw new ArgumentException("failed to identify DataMember", ame);
            }
            catch (ArgumentException ae)
            {
                throw new ArgumentException("failed to identify DataMember", ae);
            }

            try
            {
                ((INotifyPropertyChanged)this.DataSource).PropertyChanged += this.DataSource_PropertyChanged;
            }
            catch (NullReferenceException nre)
            {
                throw new ArgumentException("dataSource does not implement INotifyPropertyChanged", nre);
            }

            this.UpdateValue();
        }

        /// <summary>
        /// Gets the target object to update
        /// </summary>
        public object Target { get; private set; }

        /// <summary>
        /// Gets the name of the property to update
        /// </summary>
        public string PropertyName { get; private set; }

        /// <summary>
        /// Gets the DataSource with the property to monitor for changes
        /// </summary>
        public object DataSource { get; private set; }

        /// <summary>
        /// Gets the name of the property to update
        /// </summary>
        public string DataMember { get; private set; }

        /// <summary>
        /// Disposes an instance of the OneWayBinder class
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Diposes an instance of the OneWayBinder class
        /// </summary>
        /// <param name="disposing">True to dispose managed as well as native resources</param>
        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                }

                this.disposed = true;
            }
        }

        /// <summary>
        /// Updates the Target.[PropertyName] with the new value from DataSource.[DataMemeber]
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void DataSource_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (this.DataMember.Equals(e.PropertyName))
            {
                this.UpdateValue();
            }
        }

        /// <summary>
        /// Synchronises the Target value to the DataSource
        /// </summary>
        private void UpdateValue()
        {
            object currentValue;
            object newValue;

            currentValue = this.target.GetValue(this.Target, null);
            newValue = this.source.GetValue(this.DataSource, null);

            if (currentValue != newValue)
            {
                this.target.SetValue(this.Target, newValue, null);
            }
        }
    }
}
